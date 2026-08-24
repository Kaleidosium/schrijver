<script lang="ts">
    import {
        defaultKeymap,
        history,
        historyKeymap,
        indentWithTab,
        insertNewlineAndIndent,
        redo,
        redoDepth,
        selectAll,
        undo,
        undoDepth,
    } from "@codemirror/commands";
    import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
    import { syntaxHighlighting, syntaxTree } from "@codemirror/language";
    import { linter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
    import {
        closeSearchPanel,
        openSearchPanel,
        search,
        searchKeymap,
        searchPanelOpen,
    } from "@codemirror/search";
    import {
        EditorSelection,
        EditorState,
        Prec,
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
        calculateDocumentStats,
        calculateSelectionStats,
        countWords,
        maskMarkdownForProse,
        type DocumentStats,
        type SelectionStats,
        type TextRange,
    } from "$lib/writing";
    import {
        emptySidecar,
        fallbackFileNames,
        hashText,
        normalizeMarkdownFileName,
        outlineItems,
        parseRecovery,
        parseSidecar,
        resolveTextSelector,
        sidecarName,
        type OutlineItem,
        type RecoveryJournal,
        type WriterNote,
        type WriterSidecar,
    } from "$lib/writer-document";
    import { Dialog } from "bits-ui";
    import { marked } from "marked";
    import { createHotkeys } from "@tanstack/svelte-hotkeys";
    import { untrack } from "svelte";
    import type { Attachment } from "svelte/attachments";
    import {
        markdownHighlightStyle,
        writerTheme,
    } from "./writer-editor-theme";
    import {
        APP_SHORTCUTS,
        clearFormatting,
        deleteSelection,
        insertCodeBlock,
        insertFootnote,
        insertHorizontalRule,
        insertLink,
        insertParagraphBreak,
        paragraphNavigationKeymap,
        toggleBlockquote,
        toggleBulletList,
        toggleHeading,
        toggleInlineFormat,
        toggleNumberedList,
        toggleTaskList,
    } from "./writer-commands";
    import WriterPanels from "./WriterPanels.svelte";
    import { createZedSearchPanel } from "./writer-search-panel";
    import WriterStatus from "./WriterStatus.svelte";
    import WriterToolbar from "./WriterToolbar.svelte";
    import type {
        FocusScope,
        NoteView,
        PartOfSpeech,
        ReviewCheck,
    } from "./writer-types";

    const RECOVERY_KEY = "schrijver:recovery:v1";
    const ACTION_BAR_KEY = "schrijver:action-bar:v1";
    const ZOOM_KEY = "schrijver:zoom:v1";
    const RECOVERY_DELAY = 600;
    const DEFAULT_FILE_NAME = "schrijver-draft.md";
    const MIN_ZOOM = 50;
    const MAX_ZOOM = 300;
    const ZOOM_STEP = 10;
    type NlpParser = typeof import("compromise").default;
    type WriteGood = typeof import("write-good").default;
    interface PickerWindow extends Window {
        showDirectoryPicker?: (options?: {
            mode?: "read" | "readwrite";
        }) => Promise<FileSystemDirectoryHandle>;
    }
    interface FileSystemPermissionDescriptor {
        readonly mode?: "read" | "readwrite";
    }
    interface PermissionedFileSystemHandle {
        queryPermission?: (
            descriptor?: FileSystemPermissionDescriptor,
        ) => Promise<PermissionState>;
        requestPermission?: (
            descriptor?: FileSystemPermissionDescriptor,
        ) => Promise<PermissionState>;
    }
    interface OpenedFile {
        readonly file: File;
    }
    interface ManuscriptCandidate {
        readonly name: string;
        readonly label: string;
        readonly modifiedAt: number;
        readonly markdownHandle: FileSystemFileHandle;
        readonly sidecarHandle?: FileSystemFileHandle;
    }
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
    const workspaceScroll = EditorState.transactionExtender.of(
        (transaction) => {
            if (loadingProject) {
                return null;
            }

            const cursorMove =
                transaction.selection !== undefined &&
                transaction.newSelection.ranges.every((range) => range.empty);
            const isTypewriter = transaction.state.field(typewriterModeField);
            const enablingTypewriter = transaction.effects.some(
                (effect) => effect.is(setTypewriterMode) && effect.value,
            );

            if (isTypewriter) {
                if (
                    !transaction.docChanged &&
                    !cursorMove &&
                    !enablingTypewriter
                ) {
                    return null;
                }

                return {
                    effects: EditorView.scrollIntoView(
                        transaction.newSelection.main.head,
                        { y: "center" },
                    ),
                };
            }

            if (!transaction.docChanged && !cursorMove) {
                return null;
            }

            return {
                effects: EditorView.scrollIntoView(
                    transaction.newSelection.main.head,
                    {
                        y: "nearest",
                        yMargin: 48,
                    },
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
    const refreshNotes = StateEffect.define<void>();
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
    let fileName = $state(DEFAULT_FILE_NAME);
    let projectId = $state("");
    let baselineHash = $state<string | undefined>();
    let dirty = $state(false);
    let journalSaved = $state(false);
    let saveState = $state<
        "idle" | "recovered" | "saving" | "saved" | "downloaded" | "error"
    >("idle");
    let recoveryAvailable = $state(true);
    let recoveryRestored = $state(false);
    let storageConflict = $state(false);
    let outlineOpen = $state(false);
    let notesOpen = $state(false);
    let guideOpen = $state(false);
    let searchOpen = $state(false);
    let readerMode = $state(false);
    let activeNoteId = $state<string | undefined>();
    let autofocusNoteId = $state<string | undefined>();
    let hasTextSelection = $state(false);
    let canUndo = $state(false);
    let canRedo = $state(false);
    let canJumpToTop = $state(false);
    let canJumpToEnd = $state(false);
    let canSelectAll = $derived(draft.length > 0);
    let outline = $state.raw<OutlineItem[]>([]);
    let notes = $state<WriterNote[]>([]);
    let noteTops = $state<Record<string, number>>({});
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
    let selectedText = $state("");
    let nlpParser: NlpParser | undefined;
    let writeGoodRunner: WriteGood | undefined;
    let directoryHandle: FileSystemDirectoryHandle | undefined;
    let markdownHandle: FileSystemFileHandle | undefined;
    let sidecarHandle: FileSystemFileHandle | undefined;
    let pendingOpenDirectory: FileSystemDirectoryHandle | undefined;
    let manuscriptCandidates = $state.raw<ManuscriptCandidate[]>([]);
    let manuscriptDialogOpen = $state(false);
    let unsavedDialogOpen = $state(false);
    let manuscriptOpening = $state(false);
    let fallbackInput: HTMLInputElement | undefined;
    let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
    let recoveryRevision = 0;
    let lastFallbackSaveTime = 0;
    let actionBarOpen = $state(loadInitialActionBar());
    let zoomLevel = $state(loadInitialZoom());
    let loadingProject = false;

    function loadInitialActionBar(): boolean {
        try {
            const raw = localStorage.getItem(ACTION_BAR_KEY);
            return raw !== null ? raw === "true" : true;
        } catch {
            return true;
        }
    }

    function setActionBarOpen(open: boolean): void {
        actionBarOpen = open;
        try {
            localStorage.setItem(ACTION_BAR_KEY, String(open));
        } catch {
            // Ignore
        }
    }

    function loadInitialZoom(): number {
        try {
            const raw = localStorage.getItem(ZOOM_KEY);
            if (raw !== null) {
                const parsed = Number(raw);
                if (!Number.isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
                    return parsed;
                }
            }
        } catch {
            // Ignore
        }
        return 100;
    }

    function setZoom(nextZoom: number): void {
        zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
        try {
            localStorage.setItem(ZOOM_KEY, String(zoomLevel));
        } catch {
            // Ignore
        }
    }

    function zoomIn(): void {
        setZoom(zoomLevel + ZOOM_STEP);
    }

    function zoomOut(): void {
        setZoom(zoomLevel - ZOOM_STEP);
    }

    function zoomReset(): void {
        setZoom(100);
    }

    function handleUndo(): void {
        if (editor) {
            undo(editor);
            editor.focus();
        }
    }

    function handleRedo(): void {
        if (editor) {
            redo(editor);
            editor.focus();
        }
    }

    async function handleCut(): Promise<void> {
        if (!editor) {
            return;
        }
        const selection = editor.state.selection.main;
        if (selection.empty) {
            return;
        }
        await navigator.clipboard.writeText(editor.state.doc.sliceString(selection.from, selection.to)).catch(() => {});
        editor.dispatch({
            changes: { from: selection.from, to: selection.to, insert: "" },
            selection: EditorSelection.cursor(selection.from),
            scrollIntoView: true,
            userEvent: "delete.cut",
        });
        editor.focus();
    }

    async function handleCopy(): Promise<void> {
        if (!editor) {
            return;
        }
        const selection = editor.state.selection.main;
        if (!selection.empty) {
            await navigator.clipboard.writeText(editor.state.doc.sliceString(selection.from, selection.to)).catch(() => {});
            editor.focus();
        }
    }

    async function handlePaste(): Promise<void> {
        if (!editor) {
            return;
        }
        const text = await navigator.clipboard.readText().catch(() => "");
        if (text) {
            const selection = editor.state.selection.main;
            editor.dispatch({
                changes: { from: selection.from, to: selection.to, insert: text },
                selection: EditorSelection.cursor(selection.from + text.length),
                scrollIntoView: true,
                userEvent: "input.paste",
            });
            editor.focus();
        }
    }

    function handleDelete(): void {
        if (editor) {
            deleteSelection(editor);
        }
    }

    function handleClearFormatting(): void {
        if (editor) {
            clearFormatting(editor);
        }
    }

    function handleSelectAll(): void {
        if (editor) {
            selectAll(editor);
            editor.focus();
        }
    }
    const documentStats = $derived(calculateDocumentStats(draft));
    const selectionStats = $derived(
        hasTextSelection && selectedText ? calculateSelectionStats(selectedText) : undefined,
    );
    const noteViews = $derived.by(buildNoteViews);
    const renderedHtml = $derived(
        marked.parse(draft, { async: false, gfm: true, breaks: true }) as string,
    );
    const attachEditor: Attachment<HTMLDivElement> = (editorElement) =>
        untrack(() => {
        const recovery = loadInitialRecovery();
        const initialDraft = recovery?.markdown ?? "";
        const initialContext = recovery?.context;

        draft = initialDraft;
        fileName = recovery?.fileName ?? DEFAULT_FILE_NAME;
        projectId =
            recovery?.sidecar.projectId ?? emptySidecar(fileName).projectId;
        notes = recovery?.sidecar.notes.map((note) => ({ ...note })) ?? [];
        baselineHash = recovery?.baselineHash;
        recoveryRevision = recovery?.revision ?? 0;
        recoveryRestored = Boolean(recovery);
        dirty = Boolean(recovery);
        journalSaved = Boolean(recovery);
        saveState = recovery ? "recovered" : "idle";
        outlineOpen = initialContext?.outlineOpen ?? false;
        notesOpen = initialContext?.notesOpen ?? false;
        activeNoteId = initialContext?.activeNoteId;
        editor = new EditorView({
            parent: editorElement,
            state: EditorState.create({
                doc: initialDraft,
                selection: {
                    anchor: clampPosition(
                        initialContext?.anchor ?? 0,
                        initialDraft.length,
                    ),
                    head: clampPosition(
                        initialContext?.head ?? 0,
                        initialDraft.length,
                    ),
                },
                extensions: [
                    history(),
                    markdown({
                        base: markdownLanguage,
                        completeHTMLTags: false,
                        pasteURLAsLink: false,
                    }),
                    syntaxHighlighting(markdownHighlightStyle),
                    search({ top: true, createPanel: createZedSearchPanel }),
                    linter(writeGoodDiagnostics, { delay: 900 }),
                    writerTheme,
                    focusScopeField,
                    typewriterModeField,
                    typewriterAttributes,
                    hemingwayModeField,
                    workspaceScroll,
                    hemingwayFilter,
                    syntaxModeField,
                    focusPlugin,
                    syntaxPlugin,
                    headingMarkPlugin,
                    notePlugin,
                    notePositionPlugin,
                    EditorView.lineWrapping,
                    EditorView.contentAttributes.of({
                        "aria-label": "Markdown draft",
                        autocapitalize: "sentences",
                        spellcheck: "true",
                    }),
                    EditorView.updateListener.of((update) => {
                        const nextSearchOpen = searchPanelOpen(update.state);
                        if (searchOpen !== nextSearchOpen) {
                            searchOpen = nextSearchOpen;
                            requestAnimationFrame(updateNotePositions);
                        }

                        if (update.docChanged) {
                            draft = update.state.doc.toString();
                            remapNotes(update.startState, update.state, (position, association) =>
                                update.changes.mapPos(position, association),
                            );
                            outline = outlineItems(update.state);

                            if (!loadingProject) {
                                markDirty();
                            }
                        }

                        if (update.selectionSet || update.docChanged) {
                            hasTextSelection = !update.state.selection.main.empty;
                            selectedText = hasTextSelection
                                ? update.state.doc.sliceString(
                                      update.state.selection.main.from,
                                      update.state.selection.main.to,
                                  )
                                : "";
                            canUndo = undoDepth(update.state) > 0;
                            canRedo = redoDepth(update.state) > 0;
                            canJumpToTop = update.state.selection.main.anchor > 0;
                            canJumpToEnd = update.state.selection.main.anchor < update.state.doc.length;

                            if (update.selectionSet) {
                                scheduleRecovery();
                            }
                        }
                    }),
                    Prec.highest(
                        keymap.of([
                            ...paragraphNavigationKeymap,
                            { key: "Enter", run: insertParagraphBreak },
                            {
                                key: "Shift-Enter",
                                run: insertNewlineAndIndent,
                            },
                        ]),
                    ),
                    keymap.of([
                        indentWithTab,
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
                        {
                            key: "Mod-b",
                            run: (view) => toggleInlineFormat(view, "**"),
                        },
                        {
                            key: "Mod-i",
                            run: (view) => toggleInlineFormat(view, "*"),
                        },
                        {
                            key: "Mod-k",
                            run: (view) => insertLink(view),
                        },
                        ...searchKeymap,
                        ...defaultKeymap,
                        ...historyKeymap,
                    ]),
                ],
            }),
        });
        outline = outlineItems(editor.state);
        searchOpen = searchPanelOpen(editor.state);
        hasTextSelection = !editor.state.selection.main.empty;
        selectedText = hasTextSelection
            ? editor.state.doc.sliceString(
                  editor.state.selection.main.from,
                  editor.state.selection.main.to,
              )
            : "";
        canUndo = undoDepth(editor.state) > 0;
        canRedo = redoDepth(editor.state) > 0;
        canJumpToTop = editor.state.selection.main.anchor > 0;
        canJumpToEnd = editor.state.selection.main.anchor < editor.state.doc.length;
        requestAnimationFrame(() => {
            const scroller = editor?.scrollDOM;

            if (scroller && initialContext) {
                scroller.scrollTop = initialContext.scrollTop;
            }

            updateNotePositions();
        });
        editor.focus();

            return () => {
                flushRecovery();
                editor?.destroy();
                editor = undefined;
            };
        });
    const attachFallbackInput: Attachment<HTMLInputElement> = (input) => {
        fallbackInput = input;

        return () => {
            fallbackInput = undefined;
        };
    };

    createHotkeys(
        [
            {
                hotkey: APP_SHORTCUTS.newDocument,
                callback: handleNew,
            },
            {
                hotkey: APP_SHORTCUTS.open,
                callback: () => void openProject(),
            },
            {
                hotkey: APP_SHORTCUTS.save,
                callback: () => void saveProject(),
            },
            {
                hotkey: APP_SHORTCUTS.saveAs,
                callback: () => void saveAsProject(),
            },
            {
                hotkey: APP_SHORTCUTS.zoomIn,
                callback: zoomIn,
            },
            {
                hotkey: APP_SHORTCUTS.zoomOut,
                callback: zoomOut,
            },
            {
                hotkey: APP_SHORTCUTS.zoomReset,
                callback: zoomReset,
            },
            {
                hotkey: APP_SHORTCUTS.focus,
                callback: () => setFocusModeValue(!focusMode),
            },
            {
                hotkey: APP_SHORTCUTS.preview,
                callback: () => {
                    readerMode = !readerMode;
                },
            },
            {
                hotkey: APP_SHORTCUTS.addNote,
                callback: () => addNote(),
            },
            {
                hotkey: APP_SHORTCUTS.outline,
                callback: () => setOutlineOpen(!outlineOpen),
            },
            {
                hotkey: APP_SHORTCUTS.review,
                callback: () => void setReviewModeValue(!reviewMode),
            },
            {
                hotkey: APP_SHORTCUTS.hemingway,
                callback: () => setHemingwayModeValue(!hemingwayMode),
            },
            {
                hotkey: APP_SHORTCUTS.guide,
                callback: () => {
                    guideOpen = !guideOpen;
                },
            },
            {
                hotkey: "Escape",
                callback: () => {
                    if (guideOpen) {
                        guideOpen = false;
                    }
                },
            },
        ],
        { ignoreInputs: false, preventDefault: true, stopPropagation: true },
    );

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
        scheduleRecovery();
        editor?.focus();
    }

    function setTypewriterModeValue(nextTypewriterMode: boolean): void {
        if (!focusMode) {
            return;
        }

        typewriterMode = nextTypewriterMode;
        editor?.dispatch({ effects: setTypewriterMode.of(typewriterMode) });
        scheduleRecovery();
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
        scheduleRecovery();
        editor?.focus();
    }

    function scrollPositionIntoView(
        view: EditorView,
        pos: number,
        options: { y?: "nearest" | "center" | "start" | "end"; yMargin?: number } = { y: "nearest", yMargin: 48 },
        attempts = 5,
    ): void {
        const targetPos = Math.max(0, Math.min(pos, view.state.doc.length));
        const isTypewriter = view.state.field(typewriterModeField);
        const isEnd = targetPos === view.state.doc.length;
        const effectiveOptions = isTypewriter
            ? ({ y: "center" as const })
            : isEnd
              ? ({ y: "end" as const, yMargin: 48 })
              : options;

        if (!isTypewriter && isEnd) {
            view.scrollDOM.scrollTop = view.scrollDOM.scrollHeight;
        }

        view.dispatch({
            effects: EditorView.scrollIntoView(targetPos, effectiveOptions),
        });

        if (attempts <= 0) {
            return;
        }

        requestAnimationFrame(() => {
            if (!editor || editor !== view) {
                return;
            }

            const scroller = view.scrollDOM;
            const scrollerRect = scroller.getBoundingClientRect();
            const coords = view.coordsAtPos(targetPos);

            if (!isTypewriter && isEnd) {
                scroller.scrollTop = scroller.scrollHeight;
            }

            const isVisible =
                coords !== null &&
                coords.top >= scrollerRect.top &&
                coords.bottom <= scrollerRect.bottom;

            if (
                !isVisible ||
                (!isTypewriter &&
                    isEnd &&
                    scroller.scrollTop < scroller.scrollHeight - scroller.clientHeight - 2)
            ) {
                scrollPositionIntoView(view, targetPos, effectiveOptions, attempts - 1);
            }
        });
    }

    function setHemingwayModeValue(nextHemingwayMode: boolean): void {
        hemingwayMode = nextHemingwayMode;

        if (!editor) {
            return;
        }

        if (hemingwayMode) {
            const targetPos = editor.state.doc.length;
            editor.dispatch({
                effects: setHemingwayMode.of(true),
                selection: { anchor: targetPos },
            });
            scrollPositionIntoView(editor, targetPos);
        } else {
            editor.dispatch({ effects: setHemingwayMode.of(false) });
        }

        scheduleRecovery();
        editor.focus();
    }

    function jumpToTop(): void {
        if (!editor) {
            return;
        }

        editor.dispatch({
            selection: { anchor: 0 },
        });
        scrollPositionIntoView(editor, 0, { y: "start" });
        editor.focus();
    }

    function jumpToEnd(): void {
        if (!editor) {
            return;
        }

        const targetPos = editor.state.doc.length;
        editor.dispatch({
            selection: { anchor: targetPos },
        });
        scrollPositionIntoView(editor, targetPos, { y: "end" });
        editor.focus();
    }

    async function setSyntaxModeValue(nextSyntaxMode: boolean): Promise<void> {
        syntaxMode = nextSyntaxMode;
        editor?.dispatch({ effects: setSyntaxMode.of(syntaxMode) });

        if (syntaxMode && !nlpParser) {
            nlpParser = (await import("compromise")).default;
            editor?.dispatch({ effects: setSyntaxMode.of(syntaxMode) });
        }

        scheduleRecovery();
        editor?.focus();
    }

    function toggleSearch(): void {
        if (!editor) {
            return;
        }

        if (searchPanelOpen(editor.state)) {
            closeSearchPanel(editor);
            searchOpen = false;
            editor.focus();
        } else {
            openSearchPanel(editor);
            searchOpen = true;
        }
        requestAnimationFrame(updateNotePositions);
    }

    async function setReviewModeValue(nextReviewMode: boolean): Promise<void> {
        if (!editor) {
            reviewMode = nextReviewMode;
            return;
        }

        reviewMode = nextReviewMode;
        scheduleRecovery();

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
        scheduleRecovery();
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
        scheduleRecovery();

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

    function setOutlineOpen(enabled: boolean): void {
        outlineOpen = enabled;
        scheduleRecovery();
    }

    function setNotesOpen(enabled: boolean): void {
        notesOpen = enabled;
        scheduleRecovery();
        requestAnimationFrame(updateNotePositions);
    }

    async function openProject(): Promise<void> {
        const picker = window as PickerWindow;

        if (!picker.showDirectoryPicker) {
            fallbackInput?.click();
            return;
        }

        try {
            const nextDirectory = await picker.showDirectoryPicker({
                mode: "read",
            });
            const candidates = await manuscriptCandidatesIn(nextDirectory);

            if (candidates.length === 0) {
                alert("This folder does not contain a Markdown file.");
                return;
            }

            if (candidates.length === 1) {
                const candidate = candidates[0];
                if (candidate) {
                    await openManuscriptCandidate(nextDirectory, candidate);
                }
                return;
            }

            pendingOpenDirectory = nextDirectory;
            manuscriptCandidates = candidates;
            manuscriptDialogOpen = true;
        } catch (error) {
            if (!isAbortError(error)) {
                saveState = "error";
                alert(error instanceof Error ? error.message : "Could not open the folder.");
            }
        }
    }

    async function openFallbackFiles(event: Event): Promise<void> {
        const input = event.currentTarget as HTMLInputElement;
        const openedFiles = [...(input.files ?? [])].map((file) => ({ file }));

        input.value = "";
        await openFiles(openedFiles);
    }

    async function openFiles(openedFiles: readonly OpenedFile[]): Promise<void> {
        const markdownFile = openedFiles.find((openedFile) =>
            /\.(?:md|markdown|txt)$/i.test(openedFile.file.name),
        );

        if (!markdownFile) {
            alert("Choose a Markdown file. Select its matching notes file if you have one.");
            return;
        }

        try {
            const notesFile = openedFiles.find(
                (openedFile) =>
                    openedFile.file.name === sidecarName(markdownFile.file.name),
            );
            const nextSidecar = notesFile
                ? parseSidecar(
                      JSON.parse(await notesFile.file.text()) as unknown,
                      markdownFile.file.name,
                  )
                : emptySidecar(markdownFile.file.name);

            if (
                !loadDiskProject(
                    await markdownFile.file.text(),
                    markdownFile.file.name,
                    nextSidecar,
                )
            ) {
                return;
            }

            directoryHandle = undefined;
            markdownHandle = undefined;
            sidecarHandle = undefined;
        } catch (error) {
            saveState = "error";
            alert(error instanceof Error ? error.message : "Could not open the file.");
        }
    }

    async function manuscriptCandidatesIn(
        directory: FileSystemDirectoryHandle,
    ): Promise<ManuscriptCandidate[]> {
        const candidates: ManuscriptCandidate[] = [];

        for await (const [name, handle] of directory.entries()) {
            if (
                handle.kind !== "file" ||
                !/\.(?:md|markdown|txt)$/i.test(name)
            ) {
                continue;
            }

            const file = await handle.getFile();
            const sidecarHandle = await existingFileHandle(
                directory,
                sidecarName(name),
            );

            candidates.push({
                name,
                label: manuscriptLabel(name),
                modifiedAt: file.lastModified,
                markdownHandle: handle,
                ...(sidecarHandle ? { sidecarHandle } : {}),
            });
        }

        return candidates.sort(
            (left, right) =>
                right.modifiedAt - left.modifiedAt ||
                left.name.localeCompare(right.name),
        );
    }

    async function chooseManuscriptCandidate(
        candidate: ManuscriptCandidate,
    ): Promise<void> {
        if (!pendingOpenDirectory || manuscriptOpening) {
            return;
        }

        manuscriptOpening = true;

        try {
            if (await openManuscriptCandidate(pendingOpenDirectory, candidate)) {
                closeManuscriptDialog();
            }
        } catch (error) {
            saveState = "error";
            alert(error instanceof Error ? error.message : "Could not open the file.");
        } finally {
            manuscriptOpening = false;
        }
    }

    async function openManuscriptCandidate(
        nextDirectory: FileSystemDirectoryHandle,
        candidate: ManuscriptCandidate,
    ): Promise<boolean> {
        const markdownText = await (await candidate.markdownHandle.getFile()).text();
        const nextSidecar = candidate.sidecarHandle
            ? parseSidecar(
                  JSON.parse(
                      await (await candidate.sidecarHandle.getFile()).text(),
                  ) as unknown,
                  candidate.name,
              )
            : emptySidecar(candidate.name);

        if (!loadDiskProject(markdownText, candidate.name, nextSidecar)) {
            return false;
        }

        directoryHandle = nextDirectory;
        markdownHandle = candidate.markdownHandle;
        sidecarHandle = candidate.sidecarHandle;
        return true;
    }

    function handleManuscriptDialogOpenChange(open: boolean): void {
        manuscriptDialogOpen = open;

        if (!open && !manuscriptOpening) {
            closeManuscriptDialog();
        }
    }

    function closeManuscriptDialog(): void {
        manuscriptDialogOpen = false;
        manuscriptCandidates = [];
        pendingOpenDirectory = undefined;
    }

    function loadDiskProject(
        markdownText: string,
        nextFileName: string,
        nextSidecar: WriterSidecar,
    ): boolean {
        const diskHash = hashText(markdownText);
        const reconnectingRecovery =
            dirty &&
            baselineHash === diskHash &&
            (projectId === nextSidecar.projectId || fileName === nextFileName);

        if (reconnectingRecovery) {
            fileName = nextFileName;
            saveState = "recovered";
            recoveryRestored = false;
            return true;
        }

        if (dirty && draft.trim() && !confirm("Replace the recovered unsaved work?")) {
            return false;
        }

        loadingProject = true;
        replaceDraft(markdownText);
        loadingProject = false;
        fileName = nextFileName;
        projectId = nextSidecar.projectId;
        notes = nextSidecar.notes.map((note) => ({ ...note }));
        baselineHash = diskHash;
        dirty = false;
        journalSaved = false;
        recoveryRestored = false;
        storageConflict = false;
        saveState = "saved";
        clearRecovery();
        refreshNoteDisplay();
        return true;
    }

    function createBlankDocument(): void {
        loadingProject = true;
        replaceDraft("", 0);
        loadingProject = false;
        fileName = DEFAULT_FILE_NAME;
        projectId = emptySidecar(DEFAULT_FILE_NAME).projectId;
        notes = [];
        noteTops = {};
        baselineHash = undefined;
        directoryHandle = undefined;
        markdownHandle = undefined;
        sidecarHandle = undefined;
        dirty = false;
        journalSaved = false;
        recoveryRestored = false;
        storageConflict = false;
        saveState = "idle";
        activeNoteId = undefined;
        autofocusNoteId = undefined;
        readerMode = false;
        clearRecovery();
        refreshNoteDisplay();
        if (editor) {
            outline = outlineItems(editor.state);
            editor.focus();
        }
    }

    function handleNew(): void {
        if (dirty) {
            unsavedDialogOpen = true;
        } else {
            createBlankDocument();
        }
    }

    function handleDiscardAndNew(): void {
        unsavedDialogOpen = false;
        createBlankDocument();
    }

    function handleCancelNew(): void {
        unsavedDialogOpen = false;
        editor?.focus();
    }

    async function handleSaveAndNew(): Promise<void> {
        unsavedDialogOpen = false;
        const saved = await saveProject();
        if (saved) {
            createBlankDocument();
        } else {
            editor?.focus();
        }
    }

    async function saveProject(): Promise<boolean> {
        const picker = window as PickerWindow;

        if (!markdownHandle && picker.showDirectoryPicker) {
            try {
                const nextDirectory = await picker.showDirectoryPicker({
                    mode: "readwrite",
                });
                const requestedName = prompt("File name", manuscriptLabel(fileName));

                if (!requestedName) {
                    return false;
                }

                const nextFileName = normalizeMarkdownFileName(requestedName);

                directoryHandle = nextDirectory;
                fileName = nextFileName;
                markdownHandle = await nextDirectory.getFileHandle(nextFileName, {
                    create: true,
                });
                sidecarHandle = await nextDirectory.getFileHandle(
                    sidecarName(nextFileName),
                    { create: true },
                );
            } catch (error) {
                if (!isAbortError(error)) {
                    saveState = "error";
                }
                return false;
            }
        }

        if (!markdownHandle) {
            return downloadProject();
        }

        if (!(await ensureReadWritePermission(directoryHandle ?? markdownHandle))) {
            markDirty();
            saveState = "error";
            alert("Allow folder editing to save the manuscript and notes.");
            return false;
        }

        saveState = "saving";

        try {
            sidecarHandle ??= await directoryHandle?.getFileHandle(
                sidecarName(fileName),
                { create: true },
            );

            if (!sidecarHandle) {
                throw new Error("Could not create the notes file.");
            }

            await writeFile(markdownHandle, draft);
            await writeFile(
                sidecarHandle,
                `${JSON.stringify(currentSidecar(), null, 2)}\n`,
            );

            baselineHash = hashText(draft);
            dirty = false;
            journalSaved = false;
            recoveryRestored = false;
            saveState = "saved";
            clearRecovery();
            return true;
        } catch {
            markDirty();
            saveState = "error";
            return false;
        }
    }

    async function saveAsProject(): Promise<void> {
        const picker = window as PickerWindow;

        if (picker.showDirectoryPicker) {
            try {
                const nextDirectory = await picker.showDirectoryPicker({
                    mode: "readwrite",
                });
                const requestedName = prompt("File name", manuscriptLabel(fileName));

                if (!requestedName) {
                    return;
                }

                const nextFileName = normalizeMarkdownFileName(requestedName);

                directoryHandle = nextDirectory;
                fileName = nextFileName;
                markdownHandle = await nextDirectory.getFileHandle(nextFileName, {
                    create: true,
                });
                sidecarHandle = await nextDirectory.getFileHandle(
                    sidecarName(nextFileName),
                    { create: true },
                );

                await writeFile(markdownHandle, draft);
                await writeFile(
                    sidecarHandle,
                    `${JSON.stringify(currentSidecar(), null, 2)}\n`,
                );

                baselineHash = hashText(draft);
                dirty = false;
                journalSaved = false;
                recoveryRestored = false;
                saveState = "saved";
                clearRecovery();
            } catch (error) {
                if (!isAbortError(error)) {
                    saveState = "error";
                    alert(error instanceof Error ? error.message : "Could not save the file.");
                }
            }
            return;
        }

        downloadProject();
    }

    function downloadProject(): boolean {
        const requestedName = prompt("File name", manuscriptLabel(fileName));

        if (!requestedName) {
            return false;
        }

        try {
            lastFallbackSaveTime = Math.max(Date.now(), lastFallbackSaveTime + 1);
            const names = fallbackFileNames(
                requestedName,
                new Date(lastFallbackSaveTime),
            );

            downloadFile(names.markdown, draft, "text/markdown;charset=utf-8");
            downloadFile(
                names.sidecar,
                `${JSON.stringify(currentSidecar(names.markdown), null, 2)}\n`,
                "application/json;charset=utf-8",
            );
            saveState = "downloaded";
            dirty = true;
            journalSaved = false;
            flushRecovery();
            return true;
        } catch (error) {
            saveState = "error";
            alert(error instanceof Error ? error.message : "Could not name the download.");
            return false;
        }
    }

    function downloadFile(name: string, content: string, type: string): void {
        const url = URL.createObjectURL(new Blob([content], { type }));
        const link = document.createElement("a");

        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function manuscriptLabel(name: string): string {
        return name.replace(/\.(?:md|markdown|txt)$/i, "");
    }

    function formatModified(timestamp: number): string {
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(timestamp);
    }

    function replaceDraft(text: string, selectionAnchor = 0): void {
        if (!editor) {
            draft = text;
            return;
        }

        const anchor = Math.max(0, Math.min(selectionAnchor, text.length));
        editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: text },
            filter: false,
            selection: { anchor },
        });

        if (anchor === 0 && editor.scrollDOM) {
            editor.scrollDOM.scrollTop = 0;
        }
    }

    function addNote(forceDocument = false): void {
        if (!editor) {
            return;
        }

        const selection = editor.state.selection.main;
        const hasSelection = forceDocument !== true && !selection.empty;
        const now = new Date().toISOString();
        const docText = editor.state.doc.toString();
        const note: WriterNote = {
            id: crypto.randomUUID(),
            body: "",
            createdAt: now,
            updatedAt: now,
            resolved: false,
            ...(hasSelection
                ? {
                      selection: {
                          from: selection.from,
                          to: selection.to,
                          quote: editor.state.doc.sliceString(
                              selection.from,
                              selection.to,
                          ),
                          prefix: docText.slice(
                              Math.max(0, selection.from - 32),
                              selection.from,
                          ),
                          suffix: docText.slice(
                              selection.to,
                              Math.min(docText.length, selection.to + 32),
                          ),
                      },
                  }
                : {}),
        };

        notes.push(note);
        activeNoteId = note.id;
        autofocusNoteId = note.id;
        notesOpen = true;
        notesChanged();
    }

    function addAnnotation(): void {
        if (!editor || editor.state.selection.main.empty) {
            return;
        }

        addNote(false);
    }

    function addDocumentNote(): void {
        addNote(true);
    }

    function updateNote(id: string, body: string): void {
        const note = notes.find((candidate) => candidate.id === id);

        if (!note) {
            return;
        }

        note.body = body;
        note.updatedAt = new Date().toISOString();
        notesChanged();
    }

    function resolveNote(id: string, resolved: boolean): void {
        const note = notes.find((candidate) => candidate.id === id);

        if (!note) {
            return;
        }

        note.resolved = resolved;
        note.updatedAt = new Date().toISOString();
        notesChanged();
    }

    function deleteNote(id: string): void {
        if (!confirm("Delete this note?")) {
            return;
        }

        notes = notes.filter((note) => note.id !== id);

        if (activeNoteId === id) {
            activeNoteId = undefined;
        }

        notesChanged();
    }

    function reattachNote(id: string): void {
        const note = notes.find((candidate) => candidate.id === id);
        const selection = editor?.state.selection.main;

        if (!editor || !note || !selection || selection.empty) {
            alert("Select the replacement text first.");
            return;
        }

        const docText = editor.state.doc.toString();
        note.selection = {
            from: selection.from,
            to: selection.to,
            quote: editor.state.doc.sliceString(selection.from, selection.to),
            prefix: docText.slice(
                Math.max(0, selection.from - 32),
                selection.from,
            ),
            suffix: docText.slice(
                selection.to,
                Math.min(docText.length, selection.to + 32),
            ),
        };
        note.updatedAt = new Date().toISOString();
        notesChanged();
    }

    function focusNote(id: string): void {
        activeNoteId = id;
        notesOpen = true;
        refreshNoteDisplay();
        scheduleRecovery();
    }

    function noteAutofocused(id: string): void {
        if (autofocusNoteId === id) {
            autofocusNoteId = undefined;
        }
    }

    function activateNote(id: string): void {
        focusNote(id);

        const note = notes.find((candidate) => candidate.id === id);
        const range = note ? noteRange(note) : undefined;

        if (range && editor) {
            editor.dispatch({
                selection: { anchor: range.from, head: range.to },
            });
            scrollPositionIntoView(editor, range.from, { y: "center" });
        } else if (note?.selection && editor) {
            const pos = Math.min(note.selection.from, editor.state.doc.length);
            editor.dispatch({
                selection: { anchor: pos },
            });
            scrollPositionIntoView(editor, pos, { y: "center" });
        }
    }

    function jumpToHeading(item: OutlineItem): void {
        if (!editor) {
            return;
        }

        editor.dispatch({
            selection: { anchor: item.from },
        });
        scrollPositionIntoView(editor, item.from, { y: "center" });
        editor.focus();
    }

    function notesChanged(): void {
        refreshNoteDisplay();
        markDirty();
    }

    function refreshNoteDisplay(): void {
        editor?.dispatch({ effects: refreshNotes.of(undefined) });
        requestAnimationFrame(updateNotePositions);
    }

    function remapNotes(
        oldState: EditorState,
        newState: EditorState,
        mapPosition: (position: number, association: -1 | 1) => number,
    ): void {
        let changed = false;

        for (const note of notes) {
            if (!note.selection) {
                continue;
            }

            const from = mapPosition(note.selection.from, 1);
            const to = mapPosition(note.selection.to, -1);

            if (from < to) {
                const quote = newState.doc.sliceString(from, to);
                const prefix = newState.doc.sliceString(
                    Math.max(0, from - 32),
                    from,
                );
                const suffix = newState.doc.sliceString(
                    to,
                    Math.min(newState.doc.length, to + 32),
                );
                note.selection = {
                    from,
                    to,
                    quote,
                    prefix,
                    suffix,
                };
            } else {
                note.selection = {
                    from,
                    to: from,
                    quote: note.selection.quote,
                    ...(note.selection.prefix !== undefined ? { prefix: note.selection.prefix } : {}),
                    ...(note.selection.suffix !== undefined ? { suffix: note.selection.suffix } : {}),
                };
            }
            changed = true;
        }

        if (changed) {
            refreshNoteDisplay();
        }
    }

    function noteRange(note: WriterNote): TextRange | undefined {
        if (!editor || !note.selection) {
            return undefined;
        }

        return noteRangeForState(note, editor.state);
    }

    function noteRangeForState(
        note: WriterNote,
        state: EditorState,
    ): TextRange | undefined {
        if (!note.selection) {
            return undefined;
        }

        return resolveTextSelector(note.selection, state.doc.toString());
    }

    function buildNoteViews(): NoteView[] {
        return notes.map((note) => {
            if (!note.selection) {
                return {
                    note,
                    anchorLabel: "Document note",
                    orphaned: false,
                    top: noteTops[note.id] ?? 0,
                };
            }

            const range = noteRange(note);
            const label = range
                ? draft
                      .slice(range.from, range.to)
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 54)
                : note.selection.quote
                  ? `“${note.selection.quote.replace(/\s+/g, " ").trim().slice(0, 48)}”`
                  : "Unattached note";

            return {
                note,
                anchorLabel: label || "Empty paragraph",
                orphaned: !range,
                top: noteTops[note.id] ?? 0,
            };
        });
    }

    function updateNotePositions(): void {
        if (!editor || !notesOpen) {
            return;
        }

        const surface =
            editor.dom.closest("#writing-surface") ??
            editor.dom.closest(".writing-surface");

        if (!(surface instanceof HTMLElement)) {
            return;
        }

        const surfaceTop = surface.getBoundingClientRect().top;
        const searchOffset = searchOpen
            ? parseFloat(
                  getComputedStyle(surface).getPropertyValue(
                      "--search-panel-height",
                  ),
              ) || 84
            : 0;
        const asideTop = surfaceTop + searchOffset;
        const docLength = editor.state.doc.length;
        const ordered = notes
            .map((note) => {
                const range = noteRange(note);
                const pos = range
                    ? range.from
                    : note.selection
                      ? Math.min(note.selection.from, docLength)
                      : -1;
                return { note, range, pos };
            })
            .sort((left, right) => left.pos - right.pos);
        const next: Record<string, number> = {};
        let previousBottom = 0;

        for (const { note, pos } of ordered) {
            const coordinates =
                pos >= 0 ? editor.coordsAtPos(pos) : null;
            const anchorTop =
                pos === -1
                    ? 0
                    : Math.max(
                          0,
                          (coordinates?.top ?? asideTop) - asideTop,
                      );
            const top = Math.max(anchorTop, previousBottom);

            next[note.id] = top;
            previousBottom = top + 156;
        }

        noteTops = next;
    }

    function markDirty(): void {
        dirty = true;
        journalSaved = false;

        if (saveState !== "downloaded") {
            saveState = "recovered";
        }

        scheduleRecovery();
    }

    function scheduleRecovery(): void {
        if (!dirty || storageConflict) {
            return;
        }

        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
        }

        recoveryTimer = setTimeout(writeRecovery, RECOVERY_DELAY);
    }

    function flushRecovery(): void {
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = undefined;
        }

        if (dirty && !storageConflict) {
            writeRecovery();
        }
    }

    function writeRecovery(): void {
        if (!editor || !dirty || storageConflict) {
            return;
        }

        recoveryRevision += 1;
        const selection = editor.state.selection.main;
        const journal: RecoveryJournal = {
            version: 1,
            markdown: draft,
            fileName,
            ...(baselineHash ? { baselineHash } : {}),
            sidecar: currentSidecar(),
            context: {
                anchor: selection.anchor,
                head: selection.head,
                scrollTop: editor.scrollDOM.scrollTop,
                ...(activeNoteId ? { activeNoteId } : {}),
                outlineOpen,
                notesOpen,
            },
            updatedAt: new Date().toISOString(),
            revision: recoveryRevision,
        };

        try {
            localStorage.setItem(RECOVERY_KEY, JSON.stringify(journal));
            recoveryAvailable = true;
            journalSaved = true;
        } catch {
            recoveryAvailable = false;
            journalSaved = false;
        }
    }

    function clearRecovery(): void {
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = undefined;
        }

        try {
            localStorage.removeItem(RECOVERY_KEY);
        } catch {
            // The file save still succeeded; local recovery is secondary.
        }
    }

    function currentSidecar(markdownFile = fileName): WriterSidecar {
        return {
            version: 1,
            projectId,
            markdownFile,
            notes: $state.snapshot(notes),
        };
    }

    function loadInitialRecovery(): RecoveryJournal | undefined {
        return parseRecovery(localStorage.getItem(RECOVERY_KEY));
    }

    function handleVisibilityChange(): void {
        if (document.visibilityState === "hidden") {
            flushRecovery();
        }
    }

    function handlePageHide(): void {
        flushRecovery();
    }

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
        flushRecovery();

        if (dirty && !recoveryAvailable) {
            event.preventDefault();
        }
    }

    function handleStorage(event: StorageEvent): void {
        if (event.key !== RECOVERY_KEY) {
            return;
        }

        const other = parseRecovery(event.newValue);

        if (other && other.revision > recoveryRevision) {
            storageConflict = true;
        }
    }

    function keepThisTab(): void {
        storageConflict = false;
        markDirty();
        flushRecovery();
    }

    function reloadOtherRecovery(): void {
        location.reload();
    }

    async function existingFileHandle(
        directory: FileSystemDirectoryHandle,
        name: string,
    ): Promise<FileSystemFileHandle | undefined> {
        try {
            return await directory.getFileHandle(name);
        } catch (error) {
            if (error instanceof DOMException && error.name === "NotFoundError") {
                return undefined;
            }

            throw error;
        }
    }

    async function writeFile(
        handle: FileSystemFileHandle,
        content: string,
    ): Promise<void> {
        const writable = await handle.createWritable();

        await writable.write(content);
        await writable.close();
    }

    async function ensureReadWritePermission(
        handle: FileSystemHandle,
    ): Promise<boolean> {
        const permissioned = handle as FileSystemHandle &
            PermissionedFileSystemHandle;

        if (!permissioned.queryPermission || !permissioned.requestPermission) {
            return true;
        }

        const descriptor = { mode: "readwrite" } as const;

        if ((await permissioned.queryPermission(descriptor)) === "granted") {
            return true;
        }

        return (await permissioned.requestPermission(descriptor)) === "granted";
    }

    function clampPosition(position: number, length: number): number {
        return Math.min(Math.max(position, 0), length);
    }

    function isAbortError(error: unknown): boolean {
        return error instanceof DOMException && error.name === "AbortError";
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

        for (const { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node) {
                    if (/^ATXHeading[1-6]$/.test(node.name)) {
                        const line = view.state.doc.lineAt(node.from);
                        const match = /^(#{1,6})\s/.exec(line.text);
                        if (match) {
                            builder.add(
                                line.from,
                                line.from + match[0].length,
                                Decoration.replace({
                                    widget: new HeadingMarkWidget(match[0]),
                                }),
                            );
                        }
                    }
                },
            });
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

    function buildNoteDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const ranges = notes
            .filter((note) => !note.resolved)
            .map((note) => ({
                note,
                range: noteRangeForState(note, view.state),
            }))
            .filter(
                (
                    item,
                ): item is { note: WriterNote; range: TextRange } =>
                    Boolean(item.range),
            )
            .sort((left, right) => left.range.from - right.range.from);

        for (const { note, range } of ranges) {
            builder.add(
                range.from,
                range.to,
                Decoration.mark({
                    attributes: { "data-writer-note-id": note.id },
                    class:
                        note.id === activeNoteId
                            ? "cm-writer-note-anchor cm-writer-note-anchor-active"
                            : "cm-writer-note-anchor",
                }),
            );
        }

        return builder.finish();
    }

    const notePlugin = ViewPlugin.fromClass(
        class {
            decorations: DecorationSet;

            constructor(view: EditorView) {
                this.decorations = buildNoteDecorations(view);
            }

            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.transactions.some((transaction) =>
                        transaction.effects.some((effect) =>
                            effect.is(refreshNotes),
                        ),
                    )
                ) {
                    this.decorations = buildNoteDecorations(update.view);
                }
            }
        },
        {
            decorations: (plugin) => plugin.decorations,
            eventHandlers: {
                click: (event) => {
                    const target =
                        event.target instanceof Element
                            ? event.target.closest<HTMLElement>("[data-writer-note-id]")
                            : null;
                    const id = target?.dataset.writerNoteId;

                    if (!id) {
                        return false;
                    }

                    activateNote(id);
                    return true;
                },
            },
        },
    );

    const notePositionPlugin = ViewPlugin.fromClass(
        class {
            update(update: ViewUpdate): void {
                if (
                    update.docChanged ||
                    update.viewportChanged ||
                    update.geometryChanged
                ) {
                    requestAnimationFrame(updateNotePositions);
                }
            }
        },
        {
            eventHandlers: {
                scroll: () => {
                    requestAnimationFrame(updateNotePositions);
                    return false;
                },
            },
        },
    );
</script>

<svelte:window
	onbeforeunload={handleBeforeUnload}
	onpagehide={handlePageHide}
	onstorage={handleStorage}
/>
<svelte:document onvisibilitychange={handleVisibilityChange} />

<a
	href="#writing-surface"
	class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:border focus:border-rule focus:bg-paper focus:px-3 focus:py-1.5 focus:font-sans focus:text-[0.78rem] focus:font-medium focus:text-accent-ink focus:shadow-md focus:outline-2 focus:outline-accent"
>
	Skip to writing surface
</a>

<main
	class="group grid h-screen min-h-screen grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-page font-mono text-ink"
	data-focused={focusMode && focusScope !== "all"}
	style:--editor-zoom-factor={zoomLevel / 100}
>
    <WriterToolbar
        {actionBarOpen}
        {canJumpToEnd}
        {canJumpToTop}
        {canRedo}
        {canSelectAll}
        {canUndo}
        {focusMode}
        {focusScope}
        hasSelection={hasTextSelection}
        {hemingwayMode}
        {notesOpen}
        onActionBarToggle={() => setActionBarOpen(!actionBarOpen)}
        onClearFormatting={handleClearFormatting}
        onCopy={handleCopy}
        onCut={handleCut}
        onDelete={handleDelete}
        onFocusModeChange={setFocusModeValue}
        onFocusScopeChange={setFocusScopeValue}
        onGuideOpen={() => (guideOpen = true)}
        onHemingwayModeChange={setHemingwayModeValue}
        onJumpToEnd={jumpToEnd}
        onJumpToTop={jumpToTop}
        onNew={handleNew}
        onNotesOpenChange={setNotesOpen}
        onOpen={openProject}
        onOutlineOpenChange={setOutlineOpen}
        onPaste={handlePaste}
        onReaderModeToggle={() => (readerMode = !readerMode)}
        onRedo={handleRedo}
        onReviewCheckChange={setReviewCheckValue}
        onReviewModeChange={setReviewModeValue}
        onSave={saveProject}
        onSaveAs={saveAsProject}
        onSearch={toggleSearch}
        onSelectAll={handleSelectAll}
        onSyntaxModeChange={setSyntaxModeValue}
        onSyntaxPartChange={setSyntaxPartValue}
        onTypewriterModeChange={setTypewriterModeValue}
        onUndo={handleUndo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        {outlineOpen}
        {readerMode}
        {reviewChecks}
        {reviewMode}
        {searchOpen}
        {syntaxMode}
        {syntaxParts}
        {typewriterMode}
    />

    <section id="writing-surface" class="relative min-h-0 flex-1 overflow-hidden p-0" aria-label="Writing surface">
        {#if recoveryRestored}
            <div
                class="absolute top-xs left-1/2 z-30 flex max-w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2xs rounded-md border border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-rule))] bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-accent))] px-xs py-2xs font-sans text-[0.82rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.09)] max-[42rem]:right-2xs max-[42rem]:left-2xs max-[42rem]:translate-x-0 max-[42rem]:flex-wrap"
                role="status"
                aria-live="polite"
            >
                <span class="flex-1">Unsaved changes restored from this browser.</span>
                <button
                    class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                    type="button"
                    onclick={() => (recoveryRestored = false)}
                >
                    Dismiss
                </button>
            </div>
        {/if}
        {#if storageConflict}
            <div
                class="absolute top-xs left-1/2 z-30 flex max-w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-2xs rounded-md border border-[color-mix(in_srgb,var(--color-mark)_45%,var(--color-rule))] bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-accent))] px-xs py-2xs font-sans text-[0.82rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.09)] max-[42rem]:right-2xs max-[42rem]:left-2xs max-[42rem]:translate-x-0 max-[42rem]:flex-wrap"
                role="alert"
                aria-live="assertive"
            >
                <span class="flex-1">Another tab has newer recovered work.</span>
                <button
                    class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                    type="button"
                    onclick={reloadOtherRecovery}
                >
                    Load it
                </button>
                <button
                    class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                    type="button"
                    onclick={keepThisTab}
                >
                    Keep this tab
                </button>
            </div>
        {/if}
        <WriterPanels
            {activeNoteId}
            {autofocusNoteId}
            {guideOpen}
            {noteViews}
            {notesOpen}
            onActivateNote={focusNote}
            onAddNote={addDocumentNote}
            onAutofocusNote={noteAutofocused}
            onCloseGuide={() => (guideOpen = false)}
            onDeleteNote={deleteNote}
            onJumpToNote={activateNote}
            onJumpToHeading={jumpToHeading}
            onReattachNote={reattachNote}
            onResolveNote={resolveNote}
            onUpdateNote={updateNote}
            {outline}
            {outlineOpen}
            {searchOpen}
        />
        {#if readerMode}
            <div
                class={[
                    "h-full min-h-0 overflow-y-auto transition-[padding] duration-150",
                    outlineOpen && "lg:pl-rail",
                    notesOpen && "lg:pr-rail",
                ]}
                data-reader-mode="true"
            >
                <article
                    class="prose font-serif max-w-[70ch] mx-auto px-(--editor-inline-space) py-(--editor-block-space) leading-relaxed"
                >
                    {@html renderedHtml}
                </article>
            </div>
        {/if}
        <div
            class={[
                "h-full min-h-0",
                searchOpen && "[&_.cm-scroller]:scroll-pt-[calc(var(--search-panel-height)+1rem)]",
                outlineOpen && "lg:[&_.cm-scroller]:pl-rail",
                notesOpen && "lg:[&_.cm-scroller]:pr-rail",
                readerMode && "hidden",
            ]}
            {@attach attachEditor}
        ></div>
    </section>

    <Dialog.Root
        open={manuscriptDialogOpen}
        onOpenChange={handleManuscriptDialogOpenChange}
    >
        {#if manuscriptCandidates.length > 0}
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs" />
                <Dialog.Content
                    class="fixed top-1/2 left-1/2 z-51 grid max-h-[min(36rem,calc(100svh-2rem))] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)] overscroll-contain rounded-md border border-rule bg-paper p-m font-sans text-ink shadow-[0_1rem_3rem_rgba(34,35,31,0.16)] outline-none"
                >
                    <header class="flex items-start justify-between gap-s">
                        <div>
                            <Dialog.Title class="text-[1.1rem] font-bold text-pretty">
                                Choose manuscript
                            </Dialog.Title>
                            <Dialog.Description class="mt-3xs text-[0.82rem] leading-relaxed text-muted">
                                Most recently modified first. Notes load from the matching sidecar.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close
                            class="shrink-0 cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:cursor-default disabled:opacity-50"
                            disabled={manuscriptOpening}
                            type="button"
                        >
                            Cancel
                        </Dialog.Close>
                    </header>
                    <div class="mt-s grid min-h-0 gap-3xs overflow-y-auto overscroll-y-contain">
                        {#each manuscriptCandidates as candidate (candidate.name)}
                            <button
                                aria-label={`Open ${candidate.name}`}
                                class="grid w-full cursor-pointer gap-3xs rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_82%,var(--color-page))] p-2xs text-left text-ink transition-colors hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:cursor-default disabled:opacity-50"
                                disabled={manuscriptOpening}
                                type="button"
                                onclick={() => void chooseManuscriptCandidate(candidate)}
                            >
                                <span class="flex items-baseline justify-between gap-s">
                                    <span class="truncate font-bold">{candidate.label}</span>
                                    <span
                                        class={[
                                            "shrink-0 text-[0.72rem]",
                                            candidate.sidecarHandle ? "text-accent-ink" : "text-muted",
                                        ]}
                                    >
                                        {candidate.sidecarHandle ? "Notes found" : "No notes yet"}
                                    </span>
                                </span>
                                <span class="flex items-baseline justify-between gap-s text-[0.72rem] text-muted">
                                    <span>{candidate.name}</span>
                                    <span>Modified {formatModified(candidate.modifiedAt)}</span>
                                </span>
                            </button>
                        {/each}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        {/if}
    </Dialog.Root>

    <Dialog.Root
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
            unsavedDialogOpen = open;
            if (!open) {
                editor?.focus();
            }
        }}
    >
        <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs" />
            <Dialog.Content
                class="fixed top-1/2 left-1/2 z-51 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-rule bg-paper p-m font-sans text-ink shadow-[0_1rem_3rem_rgba(34,35,31,0.16)] outline-none"
            >
                <header class="flex items-start justify-between gap-s">
                    <div>
                        <Dialog.Title class="text-[1.1rem] font-bold text-pretty">
                            Unsaved changes
                        </Dialog.Title>
                        <Dialog.Description class="mt-2xs text-[0.82rem] leading-relaxed text-muted">
                            Do you want to save the changes to “{manuscriptLabel(fileName)}” before creating a new document?
                        </Dialog.Description>
                    </div>
                </header>
                <div class="mt-m flex items-center justify-end gap-2xs">
                    <button
                        class="cursor-pointer rounded-xs border border-rule bg-paper px-2.5 py-1.5 text-[0.78rem] font-medium text-muted hover:border-mark hover:text-mark focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                        type="button"
                        onclick={handleDiscardAndNew}
                    >
                        Discard
                    </button>
                    <button
                        class="cursor-pointer rounded-xs border border-rule bg-paper px-2.5 py-1.5 text-[0.78rem] font-medium text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                        type="button"
                        onclick={handleCancelNew}
                    >
                        Cancel
                    </button>
                    <button
                        class="cursor-pointer rounded-xs border border-accent bg-accent px-3 py-1.5 text-[0.78rem] font-medium text-paper hover:bg-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                        type="button"
                        onclick={() => void handleSaveAndNew()}
                    >
                        Save
                    </button>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>

    {#if actionBarOpen}
        <WriterStatus
            disabled={readerMode}
            {documentStats}
            {selectionStats}
            onAddAnnotation={addAnnotation}
            onToggleFormat={(open, close) => editor && toggleInlineFormat(editor, open, close)}
            onToggleHeading={(level) => editor && toggleHeading(editor, level)}
            onToggleBlockquote={() => editor && toggleBlockquote(editor)}
            onToggleBulletList={() => editor && toggleBulletList(editor)}
            onToggleNumberedList={() => editor && toggleNumberedList(editor)}
            onToggleTaskList={() => editor && toggleTaskList(editor)}
            onInsertLink={() => editor && insertLink(editor)}
            onInsertCodeBlock={() => editor && insertCodeBlock(editor)}
            onInsertHorizontalRule={() => editor && insertHorizontalRule(editor)}
            onInsertFootnote={() => editor && insertFootnote(editor)}
        />
    {/if}
    <input
        {@attach attachFallbackInput}
        accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
        aria-label="Open file"
        class="sr-only"
        multiple
        type="file"
        onchange={(event) => void openFallbackFiles(event)}
    />
</main>
