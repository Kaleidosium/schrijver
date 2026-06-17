<script lang="ts">
	import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
	import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
	import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
	import { EditorState, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
	import {
		Decoration,
		EditorView,
		WidgetType,
		keymap,
		ViewPlugin,
		type DecorationSet,
		type ViewUpdate
	} from '@codemirror/view';
	import { tags } from '@lezer/highlight';
	import { activeParagraphRange, countWords } from '$lib/writing';
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'schrijver:draft:v1';
	const setFocusMode = StateEffect.define<boolean>();
	const focusModeField = StateField.define<boolean>({
		create: () => false,
		update(value, transaction) {
			for (const effect of transaction.effects) {
				if (effect.is(setFocusMode)) {
					return effect.value;
				}
			}

			return value;
		}
	});
	const dimText = Decoration.mark({ class: 'cm-focus-dim' });
	const markdownHighlightStyle = HighlightStyle.define([
		{ tag: tags.heading, color: 'var(--ink)', fontWeight: '700', textDecoration: 'none' },
		{ tag: tags.emphasis, fontStyle: 'italic' },
		{ tag: tags.strong, fontWeight: '700' },
		{ tag: tags.strikethrough, textDecoration: 'line-through' },
		{ tag: [tags.link, tags.url, tags.monospace], color: 'var(--accent-ink)' },
		{
			tag: [tags.processingInstruction, tags.atom, tags.contentSeparator],
			color: 'color-mix(in srgb, var(--muted) 55%, var(--page))',
			fontStyle: 'normal',
			fontWeight: '400',
			textDecoration: 'none'
		}
	]);
	const writerTheme = EditorView.theme({
		'&': {
			height: '100%',
			minHeight: '100%',
			backgroundColor: 'transparent',
			color: 'var(--ink)'
		},
		'&.cm-focused': {
			outline: 'none'
		},
		'.cm-scroller': {
			display: 'flex',
			justifyContent: 'center',
			height: '100%',
			minHeight: '100%',
			fontFamily: 'monospace',
			fontSize: '1.5em',
			lineHeight: '1.75'
		},
		'.cm-content': {
			flex: '0 1 70ch',
			width: '100%',
			maxWidth: '70ch',
			minHeight: '100%',
			margin: '0 auto',
			padding: 'var(--editor-block-space) var(--editor-inline-space)',
			caretColor: 'var(--accent)',
			fontFamily: 'inherit',
			lineHeight: 'inherit'
		},
		'.cm-line': {
			padding: '0',
			fontFamily: 'inherit',
			lineHeight: 'inherit'
		},
		'.cm-selectionBackground, .cm-content ::selection': {
			backgroundColor: 'var(--selection)'
		},
		'.cm-cursor': {
			borderLeftColor: 'var(--accent)'
		},
		'.cm-focus-dim': {
			opacity: '0.18',
			transition: 'opacity 120ms ease'
		},
		'.cm-heading-mark': {
			position: 'relative',
			left: 'calc(-1 * var(--heading-marker-width))',
			display: 'inline-block',
			width: '0',
			color: 'var(--muted)',
			opacity: '0.55',
			whiteSpace: 'pre'
		},
		'@media (max-width: 60rem)': {
			'.cm-heading-mark': {
				position: 'static',
				left: 'auto',
				width: 'auto'
			}
		}
	});

	class HeadingMarkWidget extends WidgetType {
		marker: string;

		constructor(marker: string) {
			super();
			this.marker = marker;
		}

		eq(widget: WidgetType) {
			return widget instanceof HeadingMarkWidget && widget.marker === this.marker;
		}

		toDOM() {
			const element = document.createElement('span');

			element.className = 'cm-heading-mark';
			element.style.setProperty('--heading-marker-width', `${this.marker.length}ch`);
			element.textContent = this.marker;

			return element;
		}
	}

	let editorElement: HTMLDivElement;
	let importInput: HTMLInputElement;
	let editor = $state<EditorView>();
	let draft = $state('');
	let focusMode = $state(false);
	let saveLabel = $state('Saved locally');
	const wordCount = $derived(countWords(draft));
	const characterCount = $derived(draft.length);
	const stats = $derived(
		`${wordCount} ${wordCount === 1 ? 'word' : 'words'} / ${characterCount} ${
			characterCount === 1 ? 'character' : 'characters'
		}`
	);

	onMount(() => {
		draft = localStorage.getItem(STORAGE_KEY) ?? '';
		editor = new EditorView({
			parent: editorElement,
			state: EditorState.create({
				doc: draft,
				extensions: [
					history(),
					markdown({ base: markdownLanguage, completeHTMLTags: false, pasteURLAsLink: false }),
					syntaxHighlighting(markdownHighlightStyle),
					writerTheme,
					focusModeField,
					focusParagraphPlugin,
					headingMarkPlugin,
					EditorView.lineWrapping,
					EditorView.contentAttributes.of({
						'aria-label': 'Markdown draft',
						autocapitalize: 'sentences',
						spellcheck: 'true'
					}),
					EditorView.updateListener.of((update) => {
						if (!update.docChanged) {
							return;
						}

						draft = update.state.doc.toString();
						localStorage.setItem(STORAGE_KEY, draft);
						saveLabel = 'Saved locally';
					}),
					keymap.of([...defaultKeymap, ...historyKeymap])
				]
			})
		});
		editor.focus();

		return () => editor?.destroy();
	});

	function toggleFocusMode() {
		focusMode = !focusMode;
		editor?.dispatch({ effects: setFocusMode.of(focusMode) });
		editor?.focus();
	}

	async function importDraft(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			return;
		}

		if (draft.trim().length > 0 && !confirm('Replace the current draft?')) {
			input.value = '';
			return;
		}

		replaceDraft(await file.text());
		input.value = '';
	}

	function exportDraft() {
		const url = URL.createObjectURL(new Blob([draft], { type: 'text/markdown;charset=utf-8' }));
		const link = document.createElement('a');

		link.href = url;
		link.download = 'schrijver-draft.md';
		document.body.append(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	}

	function replaceDraft(text: string) {
		if (!editor) {
			draft = text;
			localStorage.setItem(STORAGE_KEY, text);
			return;
		}

		editor.dispatch({
			changes: { from: 0, to: editor.state.doc.length, insert: text }
		});
	}

	function buildFocusDecorations(view: EditorView): DecorationSet {
		if (!view.state.field(focusModeField)) {
			return Decoration.none;
		}

		const text = view.state.doc.toString();
		const active = activeParagraphRange(text, view.state.selection.main.head);
		const builder = new RangeSetBuilder<Decoration>();

		if (active.from > 0) {
			builder.add(0, active.from, dimText);
		}

		if (active.to < text.length) {
			builder.add(active.to, text.length, dimText);
		}

		return builder.finish();
	}

	const focusParagraphPlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildFocusDecorations(view);
			}

			update(update: ViewUpdate) {
				if (
					update.docChanged ||
					update.selectionSet ||
					update.startState.field(focusModeField) !== update.state.field(focusModeField)
				) {
					this.decorations = buildFocusDecorations(update.view);
				}
			}
		},
		{
			decorations: (plugin) => plugin.decorations
		}
	);

	function buildHeadingDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();
		let codeFence: { mark: string; length: number } | undefined;

		for (let lineNumber = 1; lineNumber <= view.state.doc.lines; lineNumber += 1) {
			const line = view.state.doc.line(lineNumber);
			const fence = /^(?: {0,3})(`{3,}|~{3,})/.exec(line.text);

			if (fence) {
				const marker = fence[1];

				if (!codeFence) {
					codeFence = { mark: marker[0], length: marker.length };
				} else if (codeFence.mark === marker[0] && marker.length >= codeFence.length) {
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
					Decoration.replace({ widget: new HeadingMarkWidget(marker) })
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

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = buildHeadingDecorations(update.view);
				}
			}
		},
		{
			decorations: (plugin) => plugin.decorations
		}
	);
</script>

<svelte:head>
	<title>Schrijver</title>
	<meta
		name="description"
		content="A focused local Markdown writing surface with autosave and paragraph focus."
	/>
</svelte:head>

<main class:focused={focusMode} class="app-shell">
	<header class="topbar" aria-label="Writing controls">
		<a class="brand" href="/" aria-label="Schrijver home">Schrijver</a>
		<div class="actions">
			<button type="button" class:active={focusMode} aria-pressed={focusMode} onclick={toggleFocusMode}>
				Focus
			</button>
			<button type="button" onclick={() => importInput.click()}>Import</button>
			<button type="button" onclick={exportDraft}>Export</button>
			<input
				bind:this={importInput}
				accept=".md,.markdown,.txt,text/markdown,text/plain"
				aria-label="Import Markdown or text"
				class="visually-hidden"
				type="file"
				onchange={importDraft}
			/>
		</div>
	</header>

	<section class="writing-surface" aria-label="Writing surface">
		<div bind:this={editorElement} class="editor-host"></div>
	</section>

	<footer class="statusbar" aria-label="Draft status">
		<span>{stats}</span>
		<span>{saveLabel}</span>
	</footer>
</main>
