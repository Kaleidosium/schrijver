<script lang="ts">
	import {
		defaultKeymap,
		history,
		historyKeymap,
		indentWithTab,
		insertNewlineAndIndent
	} from '@codemirror/commands';
	import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
	import { syntaxHighlighting } from '@codemirror/language';
	import {
		Compartment,
		EditorSelection,
		EditorState,
		Prec,
		type Extension
	} from '@codemirror/state';
	import { EditorView, drawSelection, keymap, placeholder } from '@codemirror/view';
	import type { WriterNote } from '$lib/writer-document';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { insertParagraphBreak, paragraphNavigationKeymap } from './writer-commands';
	import { markdownHighlightStyle, writerNoteTheme } from './writer-editor-theme';

	interface Props {
		readonly autofocus?: boolean | undefined;
		readonly note: WriterNote;
		readonly onAutofocus?: ((id: string) => void) | undefined;
		readonly onEscape?: (() => void) | undefined;
		readonly onUpdate: (id: string, body: string) => void;
	}

	const { autofocus = false, note, onAutofocus, onEscape, onUpdate }: Props = $props();
	const editability = new Compartment();

	function noteEditability(resolved: boolean): Extension {
		return [
			EditorState.readOnly.of(resolved),
			EditorView.editable.of(!resolved),
			EditorView.contentAttributes.of({
				'aria-disabled': String(resolved),
				'aria-readonly': String(resolved)
			})
		];
	}

	const attachEditor: Attachment<HTMLDivElement> = (element) => {
		let syncing = false;
		let focused = false;
		let focusFrame: number | undefined;
		let resolved = untrack(() => note.resolved);
		const editor = new EditorView({
			parent: element,
			state: EditorState.create({
				doc: untrack(() => note.body),
				extensions: [
					history(),
					markdown({
						base: markdownLanguage,
						completeHTMLTags: false,
						pasteURLAsLink: false
					}),
					syntaxHighlighting(markdownHighlightStyle),
					writerNoteTheme,
					EditorView.lineWrapping,
					drawSelection(),
					editability.of(noteEditability(resolved)),
					EditorView.contentAttributes.of({
						autocapitalize: 'sentences',
						spellcheck: 'true'
					}),
					placeholder('Private thought…'),
					EditorView.updateListener.of((update) => {
						if (update.docChanged && !syncing) {
							onUpdate(note.id, update.state.doc.toString());
						}
					}),
					Prec.highest(
						keymap.of([
							...paragraphNavigationKeymap,
							{ key: 'Enter', run: insertParagraphBreak },
							{ key: 'Shift-Enter', run: insertNewlineAndIndent },
							{
								key: 'Escape',
								run: (view) => {
									view.contentDOM.blur();
									onEscape?.();
									return true;
								}
							}
						])
					),
					keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap])
				]
			})
		});

		$effect(() => {
			if (!autofocus || focused || note.resolved) {
				return;
			}

			focused = true;
			focusFrame = requestAnimationFrame(() => {
				editor.requestMeasure();
				editor.dispatch({
					selection: EditorSelection.cursor(editor.state.doc.length)
				});
				editor.focus();
				onAutofocus?.(note.id);
			});
		});

		$effect(() => {
			const nextResolved = note.resolved;

			if (nextResolved === resolved) {
				return;
			}

			resolved = nextResolved;
			editor.dispatch({
				effects: editability.reconfigure(noteEditability(resolved))
			});

			if (resolved) {
				editor.contentDOM.blur();
			}
		});

		$effect(() => {
			const body = note.body;
			const anchor = note.selection?.quote.replace(/\s+/g, ' ').trim().slice(0, 54);

			editor.contentDOM.setAttribute(
				'aria-label',
				anchor ? `Writer’s note for ${anchor}` : 'Writer’s note'
			);

			if (body === editor.state.doc.toString()) {
				return;
			}

			syncing = true;
			editor.dispatch({
				changes: { from: 0, to: editor.state.doc.length, insert: body }
			});
			syncing = false;
		});

		return () => {
			if (focusFrame !== undefined) {
				cancelAnimationFrame(focusFrame);
			}

			editor.destroy();
		};
	};
</script>

<div class="min-h-18 w-full min-w-0" {@attach attachEditor}></div>
