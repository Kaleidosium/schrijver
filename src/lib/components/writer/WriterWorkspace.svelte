<script lang="ts">
    import {
        defaultKeymap,
        history,
        historyKeymap,
    } from "@codemirror/commands";
    import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
    import { syntaxHighlighting } from "@codemirror/language";
    import { linter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
    import {
        highlightSelectionMatches,
        openSearchPanel,
        search,
        searchKeymap,
    } from "@codemirror/search";
    import {
        EditorState,
        RangeSetBuilder,
        StateEffect,
        StateField,
        type Transaction,
        type TransactionSpec,
    } from "@codemirror/state";
    import {
        Decoration,
        EditorView,
        WidgetType,
        keymap,
        ViewPlugin,
        type DecorationSet,
        type ViewUpdate,
    } from "@codemirror/view";
    import {
        activeParagraphRange,
        activeSentenceRange,
        countWords,
        maskMarkdownForProse,
        type TextRange,
    } from "$lib/writing";
    import type { Attachment } from "svelte/attachments";
    import {
        markdownHighlightStyle,
        writerTheme,
    } from "./writer-editor-theme";
    import { installSearchIcons } from "./writer-search-icons";
    import WriterStatus from "./WriterStatus.svelte";
    import WriterToolbar from "./WriterToolbar.svelte";
    import type {
        FocusScope,
        PartOfSpeech,
        ReviewCheck,
    } from "./writer-types";

    const STORAGE_KEY = "schrijver:draft:v1";
    type NlpParser = typeof import("compromise").default;
    type WriteGood = typeof import("write-good").default;
    interface CompromiseTerm {
        offset?: { start: number; length: number };
        tags?: string[];
    }
    interface CompromiseMatch {
        terms?: CompromiseTerm[];
    }
    const setFocusScope = StateEffect.define<FocusScope>();
    const focusScopeField = StateField.define<FocusScope>({
        create: () => "all",
        update(value, transaction) {
            for (const effect of transaction.effects) {
                if (effect.is(setFocusScope)) {
                    return effect.value;
                }
            }

            return value;
        },
    });
    const setTypewriterMode = StateEffect.define<boolean>();
    const typewriterModeField = StateField.define<boolean>({
        create: () => false,
        update(value, transaction) {
            for (const effect of transaction.effects) {
                if (effect.is(setTypewriterMode)) {
                    return effect.value;
                }
            }

            return value;
        },
    });
    const typewriterAttributes = EditorView.editorAttributes.compute(
        [typewriterModeField],
        (state) =>
            state.field(typewriterModeField) ? { class: "cm-typewriter" } : {},
    );
    const setHemingwayMode = StateEffect.define<boolean>();
    const hemingwayModeField = StateField.define<boolean>({
        create: () => false,
        update(value, transaction) {
            for (const effect of transaction.effects) {
                if (effect.is(setHemingwayMode)) {
                    return effect.value;
                }
            }

            return value;
        },
    });
    const typewriterScroll = EditorState.transactionExtender.of(
        (transaction) => {
            if (
                !transaction.state.field(typewriterModeField) ||
                (!transaction.docChanged &&
                    transaction.selection === undefined &&
                    !transaction.effects.some(
                        (effect) =>
                            effect.is(setTypewriterMode) && effect.value,
                    ))
            ) {
                return null;
            }

            return {
                effects: EditorView.scrollIntoView(
                    transaction.newSelection.main.head,
                    { y: "center" },
                ),
            };
        },
    );
    const hemingwayFilter = EditorState.transactionFilter.of((transaction) => {
        if (
            !transaction.startState.field(hemingwayModeField) ||
            transaction.effects.some(
                (effect) => effect.is(setHemingwayMode) && !effect.value,
            )
        ) {
            return transaction;
        }

        return filterHemingwayTransaction(transaction);
    });

    function filterHemingwayTransaction(
        transaction: Transaction,
    ): Transaction | TransactionSpec | readonly TransactionSpec[] {
        const documentEnd = transaction.startState.doc.length;
        const resetSelection: TransactionSpec = {
            selection: { anchor: documentEnd },
        };

        if (
            transaction.isUserEvent("undo") ||
            transaction.isUserEvent("redo")
        ) {
            return resetSelection;
        }

        if (transaction.docChanged) {
            const isComposition = transaction.isUserEvent("input.type.compose");
            let isAppend = true;

            transaction.changes.iterChanges((fromA, toA, fromB, toB) => {
                if (
                    toB === fromB ||
                    (isComposition
                        ? toA !== documentEnd
                        : fromA !== documentEnd || toA !== documentEnd)
                ) {
                    isAppend = false;
                }
            });

            if (!isAppend) {
                return resetSelection;
            }

            return [
                transaction,
                {
                    selection: { anchor: transaction.newDoc.length },
                    sequential: true,
                },
            ];
        }

        const selection = transaction.newSelection;

        if (
            transaction.selection !== undefined &&
            (selection.ranges.length !== 1 ||
                !selection.main.empty ||
                selection.main.head !== transaction.newDoc.length)
        ) {
            return [
                transaction,
                {
                    selection: { anchor: transaction.newDoc.length },
                    sequential: true,
                },
            ];
        }

        return transaction;
    }

    const setSyntaxMode = StateEffect.define<boolean>();
    const syntaxModeField = StateField.define<boolean>({
        create: () => false,
        update(value, transaction) {
            for (const effect of transaction.effects) {
                if (effect.is(setSyntaxMode)) {
                    return effect.value;
                }
            }

            return value;
        },
    });
    const dimText = Decoration.mark({ class: "cm-focus-dim" });
    const contextText = Decoration.mark({ class: "cm-focus-context" });
    const syntaxMarks: Record<PartOfSpeech, Decoration> = {
        Adjective: Decoration.mark({ class: "cm-pos cm-pos-adjective" }),
        Noun: Decoration.mark({ class: "cm-pos cm-pos-noun" }),
        Adverb: Decoration.mark({ class: "cm-pos cm-pos-adverb" }),
        Verb: Decoration.mark({ class: "cm-pos cm-pos-verb" }),
        Conjunction: Decoration.mark({ class: "cm-pos cm-pos-conjunction" }),
    };
    const syntaxOrder: PartOfSpeech[] = [
        "Adjective",
        "Noun",
        "Adverb",
        "Verb",
        "Conjunction",
    ];

    class HeadingMarkWidget extends WidgetType {
        readonly marker: string;

        constructor(marker: string) {
            super();
            this.marker = marker;
        }

        override eq(widget: WidgetType): boolean {
            return (
                widget instanceof HeadingMarkWidget &&
                widget.marker === this.marker
            );
        }

        override toDOM(): HTMLElement {
            const element = document.createElement("span");

            element.className = "cm-heading-mark";
            element.style.setProperty(
                "--heading-marker-width",
                `${this.marker.length}ch`,
            );
            element.textContent = this.marker;

            return element;
        }
    }

    let editor: EditorView | undefined;
    let draft = $state("");
    let focusMode = $state(false);
    let focusScope = $state<FocusScope>("all");
    let typewriterMode = $state(false);
    let hemingwayMode = $state(false);
    let syntaxMode = $state(false);
    let reviewMode = $state(false);
    const syntaxParts = $state<Record<PartOfSpeech, boolean>>({
        Adjective: true,
        Noun: true,
        Adverb: true,
        Verb: true,
        Conjunction: true,
    });
    const reviewChecks = $state<Record<ReviewCheck, boolean>>({
        weasel: true,
        illusion: true,
        so: true,
        thereIs: true,
        passive: true,
        adverb: true,
        tooWordy: true,
        cliches: true,
        eprime: false,
    });
    const saveLabel = "Saved locally";
    let nlpParser: NlpParser | undefined;
    let writeGoodRunner: WriteGood | undefined;
    const wordCount = $derived(countWords(draft));
    const characterCount = $derived(draft.length);
    const stats = $derived(
        `${wordCount} ${wordCount === 1 ? "word" : "words"} / ${characterCount} ${
            characterCount === 1 ? "character" : "characters"
        }`,
    );
    const attachEditor: Attachment<HTMLDivElement> = (editorElement) => {
        const initialDraft = localStorage.getItem(STORAGE_KEY) ?? "";

        draft = initialDraft;
        editor = new EditorView({
            parent: editorElement,
            state: EditorState.create({
                doc: initialDraft,
                extensions: [
                    history(),
                    markdown({
                        base: markdownLanguage,
                        completeHTMLTags: false,
                        pasteURLAsLink: false,
                    }),
                    syntaxHighlighting(markdownHighlightStyle),
                    search({ top: true }),
                    highlightSelectionMatches({
                        highlightWordAroundCursor: true,
                    }),
                    linter(writeGoodDiagnostics, { delay: 900 }),
                    writerTheme,
                    focusScopeField,
                    typewriterModeField,
                    typewriterAttributes,
                    hemingwayModeField,
                    typewriterScroll,
                    hemingwayFilter,
                    syntaxModeField,
                    focusPlugin,
                    syntaxPlugin,
                    headingMarkPlugin,
                    EditorView.lineWrapping,
                    EditorView.contentAttributes.of({
                        "aria-label": "Markdown draft",
                        autocapitalize: "sentences",
                        spellcheck: "true",
                    }),
                    EditorView.updateListener.of((update) => {
                        if (!update.docChanged) {
                            return;
                        }

                        draft = update.state.doc.toString();
                        localStorage.setItem(STORAGE_KEY, draft);
                    }),
                    keymap.of([
                        {
                            key: "Mod-z",
                            run: (view) => view.state.field(hemingwayModeField),
                        },
                        {
                            key: "Mod-Shift-z",
                            run: (view) => view.state.field(hemingwayModeField),
                        },
                        {
                            key: "Mod-y",
                            run: (view) => view.state.field(hemingwayModeField),
                        },
                        ...searchKeymap,
                        ...defaultKeymap,
                        ...historyKeymap,
                    ]),
                ],
            }),
        });
        const removeSearchIcons = installSearchIcons(editor.dom);
        editor.focus();

        return () => {
            removeSearchIcons();
            editor?.destroy();
            editor = undefined;
        };
    };

    function setFocusScopeValue(nextFocusScope: string): void {
        if (!focusMode) {
            return;
        }

        if (
            nextFocusScope !== "all" &&
            nextFocusScope !== "paragraph" &&
            nextFocusScope !== "sentence"
        ) {
            return;
        }

        focusScope = nextFocusScope;
        editor?.dispatch({ effects: setFocusScope.of(focusScope) });
        editor?.focus();
    }

    function setTypewriterModeValue(nextTypewriterMode: boolean): void {
        if (!focusMode) {
            return;
        }

        typewriterMode = nextTypewriterMode;
        editor?.dispatch({ effects: setTypewriterMode.of(typewriterMode) });
        editor?.focus();
    }

    function setFocusModeValue(nextFocusMode: boolean): void {
        focusMode = nextFocusMode;
        editor?.dispatch({
            effects: [
                setFocusScope.of(focusMode ? focusScope : "all"),
                setTypewriterMode.of(focusMode && typewriterMode),
            ],
        });
        editor?.focus();
    }

    function setHemingwayModeValue(nextHemingwayMode: boolean): void {
        hemingwayMode = nextHemingwayMode;

        if (!editor) {
            return;
        }

        if (hemingwayMode) {
            editor.dispatch({
                effects: setHemingwayMode.of(true),
                selection: { anchor: editor.state.doc.length },
                scrollIntoView: true,
            });
        } else {
            editor.dispatch({ effects: setHemingwayMode.of(false) });
        }

        editor.focus();
    }

    async function setSyntaxModeValue(nextSyntaxMode: boolean): Promise<void> {
        syntaxMode = nextSyntaxMode;
        editor?.dispatch({ effects: setSyntaxMode.of(syntaxMode) });

        if (syntaxMode && !nlpParser) {
            nlpParser = (await import("compromise")).default;
            editor?.dispatch({ effects: setSyntaxMode.of(syntaxMode) });
        }

        editor?.focus();
    }

    function showSearch(): void {
        if (editor) {
            openSearchPanel(editor);
        }
    }

    async function setReviewModeValue(nextReviewMode: boolean): Promise<void> {
        if (!editor) {
            reviewMode = nextReviewMode;
            return;
        }

        reviewMode = nextReviewMode;

        if (!reviewMode) {
            editor.dispatch(setDiagnostics(editor.state, []));
            editor.focus();
            return;
        }

        const diagnostics = await writeGoodDiagnostics(editor);

        if (reviewMode) {
            editor.dispatch(setDiagnostics(editor.state, diagnostics));
        }

        editor.focus();
    }

    function setSyntaxPartValue(part: PartOfSpeech, checked: boolean): void {
        if (!syntaxMode || syntaxParts[part] === checked) {
            return;
        }

        syntaxParts[part] = checked;
        editor?.dispatch({ effects: setSyntaxMode.of(syntaxMode) });
        editor?.focus();
    }

    async function setReviewCheckValue(
        check: ReviewCheck,
        checked: boolean,
    ): Promise<void> {
        if (!reviewMode || reviewChecks[check] === checked) {
            return;
        }

        reviewChecks[check] = checked;

        if (reviewMode && editor) {
            editor.dispatch(
                setDiagnostics(
                    editor.state,
                    await writeGoodDiagnostics(editor),
                ),
            );
            editor.focus();
        }
    }

    async function importDraft(file: File): Promise<void> {
        if (draft.trim().length > 0 && !confirm("Replace the current draft?")) {
            return;
        }

        replaceDraft(await file.text());
    }

    function exportDraft(): void {
        const url = URL.createObjectURL(
            new Blob([draft], { type: "text/markdown;charset=utf-8" }),
        );
        const link = document.createElement("a");

        link.href = url;
        link.download = "schrijver-draft.md";
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function replaceDraft(text: string): void {
        if (!editor) {
            draft = text;
            localStorage.setItem(STORAGE_KEY, text);
            return;
        }

        editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: text },
            filter: false,
            selection: { anchor: text.length },
        });
    }

    async function writeGoodDiagnostics(
        view: EditorView,
    ): Promise<Diagnostic[]> {
        if (!reviewMode) {
            return [];
        }

        writeGoodRunner ??= (await import("write-good")).default;

        if (!reviewMode) {
            return [];
        }

        const text = view.state.doc.toString();
        const prose = maskMarkdownForProse(text);

        return writeGoodRunner(prose, { ...reviewChecks })
            .map((suggestion): Diagnostic | undefined => {
                let from = Math.max(0, suggestion.index);
                let to = Math.min(
                    text.length,
                    suggestion.index + suggestion.offset,
                );

                while (from < to && /\s/.test(prose.charAt(from))) {
                    from += 1;
                }

                while (to > from && /\s/.test(prose.charAt(to - 1))) {
                    to -= 1;
                }

                if (from >= to || !prose.slice(from, to).trim()) {
                    return undefined;
                }

                return {
                    from,
                    to,
                    severity: "info",
                    markClass: "cm-prose-diagnostic",
                    message: suggestion.reason,
                };
            })
            .filter((diagnostic): diagnostic is Diagnostic =>
                Boolean(diagnostic),
            );
    }

    function buildFocusDecorations(view: EditorView): DecorationSet {
        const scope = view.state.field(focusScopeField);

        if (scope === "all") {
            return Decoration.none;
        }

        const text = view.state.doc.toString();
        const paragraph = activeParagraphRange(
            text,
            view.state.selection.main.head,
        );
        const active: TextRange =
            scope === "paragraph"
                ? paragraph
                : activeSentenceRange(text, view.state.selection.main.head);
        const builder = new RangeSetBuilder<Decoration>();

        if (paragraph.from > 0) {
            builder.add(0, paragraph.from, dimText);
        }

        if (scope === "sentence" && active.from > paragraph.from) {
            builder.add(paragraph.from, active.from, contextText);
        }

        if (scope === "sentence" && active.to < paragraph.to) {
            builder.add(active.to, paragraph.to, contextText);
        }

        if (paragraph.to < text.length) {
            builder.add(paragraph.to, text.length, dimText);
        }

        return builder.finish();
    }

    const focusPlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildFocusDecorations(view);
            }

            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.selectionSet ||
                    update.startState.field(focusScopeField) !==
                        update.state.field(focusScopeField)
                ) {
                    this.decorations = buildFocusDecorations(update.view);
                }
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
        },
    );

    function buildSyntaxDecorations(view: EditorView): DecorationSet {
        if (!view.state.field(syntaxModeField)) {
            return Decoration.none;
        }

        if (!nlpParser) {
            return Decoration.none;
        }

        const prose = maskMarkdownForProse(view.state.doc.toString());
        const terms = nlpParser(prose)
            .terms()
            .json({
                offset: true,
                terms: { tags: true, offset: true },
            }) as CompromiseMatch[];
        const builder = new RangeSetBuilder<Decoration>();

        for (const match of terms) {
            for (const term of match.terms ?? []) {
                const part = syntaxOrder.find((tag) =>
                    term.tags?.includes(tag),
                );

                if (
                    !part ||
                    !syntaxParts[part] ||
                    !term.offset ||
                    term.offset.length === 0
                ) {
                    continue;
                }

                const from = term.offset.start;
                const to = from + term.offset.length;

                if (!prose.slice(from, to).trim()) {
                    continue;
                }

                builder.add(from, to, syntaxMarks[part]);
            }
        }

        return builder.finish();
    }

    const syntaxPlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildSyntaxDecorations(view);
            }

            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.transactions.some((transaction) =>
                        transaction.effects.some((effect) =>
                            effect.is(setSyntaxMode),
                        ),
                    )
                ) {
                    this.decorations = buildSyntaxDecorations(update.view);
                }
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
        },
    );

    function buildHeadingDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        let codeFence: { mark: string; length: number } | undefined;

        for (
            let lineNumber = 1;
            lineNumber <= view.state.doc.lines;
            lineNumber += 1
        ) {
            const line = view.state.doc.line(lineNumber);
            const fence = /^(?: {0,3})(`{3,}|~{3,})/.exec(line.text);

            if (fence) {
                const marker = fence[1];

                if (!marker) {
                    continue;
                }

                const mark = marker.charAt(0);

                if (!codeFence) {
                    codeFence = { mark, length: marker.length };
                } else if (
                    codeFence.mark === mark &&
                    marker.length >= codeFence.length
                ) {
                    codeFence = undefined;
                }

                continue;
            }

            if (codeFence) {
                continue;
            }

            const heading = /^(#{1,6})\s/.exec(line.text);

            if (heading) {
                const marker = heading[0];

                builder.add(
                    line.from,
                    line.from + marker.length,
                    Decoration.replace({
                        widget: new HeadingMarkWidget(marker),
                    }),
                );
            }
        }

        return builder.finish();
    }

    const headingMarkPlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildHeadingDecorations(view);
            }

            update(update: ViewUpdate): void {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = buildHeadingDecorations(update.view);
                }
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
        },
    );
</script>

<main class={["app-shell", { focused: focusMode && focusScope !== "all" }]}>
    <WriterToolbar
        {focusMode}
        {focusScope}
        {hemingwayMode}
        {reviewChecks}
        {reviewMode}
        {syntaxMode}
        {syntaxParts}
        {typewriterMode}
        onExport={exportDraft}
        onFocusModeChange={setFocusModeValue}
        onFocusScopeChange={setFocusScopeValue}
        onHemingwayModeChange={setHemingwayModeValue}
        onImport={importDraft}
        onReviewCheckChange={setReviewCheckValue}
        onReviewModeChange={setReviewModeValue}
        onSearch={showSearch}
        onSyntaxModeChange={setSyntaxModeValue}
        onSyntaxPartChange={setSyntaxPartValue}
        onTypewriterModeChange={setTypewriterModeValue}
    />

    <section class="writing-surface" aria-label="Writing surface">
        <div class="editor-host" {@attach attachEditor}></div>
    </section>

    <WriterStatus {saveLabel} {stats} />
</main>
