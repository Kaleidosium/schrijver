import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
	EditorSelection,
	EditorState,
	type StateCommand,
	type Transaction,
	type TransactionSpec
} from '@codemirror/state';
import { describe, expect, it } from 'vite-plus/test';
import {
	APP_SHORTCUTS,
	clearFormatting,
	COMMAND_HELP,
	deleteSelection,
	insertCodeBlock,
	insertFootnote,
	insertHorizontalRule,
	insertLink,
	insertParagraphBreak,
	paragraphNavigation,
	stripMarkdownFormatting,
	toggleBlockquote,
	toggleBulletList,
	toggleHeading,
	toggleInlineFormat,
	toggleNumberedList,
	toggleTaskList,
	type MarkdownEditorContext
} from './writer-commands';

function runCommand(
	document: string,
	command: StateCommand,
	selection: { readonly anchor: number; readonly head?: number } = { anchor: document.length }
): {
	readonly applied: boolean;
	readonly document: string;
	readonly selection: EditorSelection;
} {
	let state = EditorState.create({
		doc: document,
		selection,
		extensions: [markdown({ base: markdownLanguage })]
	});
	const applied = command({
		state,
		dispatch(transaction) {
			state = transaction.state;
		}
	});

	return { applied, document: state.doc.toString(), selection: state.selection };
}

function createEditorContext(
	initialDoc: string,
	selection: { readonly anchor: number; readonly head?: number } = { anchor: 0 }
): MarkdownEditorContext & { doc: string; selection: EditorSelection } {
	let state = EditorState.create({
		doc: initialDoc,
		selection,
		extensions: [markdown({ base: markdownLanguage })]
	});

	return {
		get state() {
			return state;
		},
		get doc() {
			return state.doc.toString();
		},
		get selection() {
			return state.selection;
		},
		dispatch(tr: Transaction | TransactionSpec) {
			const transaction = 'state' in tr ? tr : state.update(tr);
			state = transaction.state;
		},
		focus() {}
	};
}

function applyParagraphBreak(document: string): {
	readonly applied: boolean;
	readonly document: string;
} {
	const result = runCommand(document, insertParagraphBreak);
	return { applied: result.applied, document: result.document };
}

function cursor(
	document: string,
	direction: 'left' | 'right' | 'up' | 'down',
	position: number
): { readonly applied: boolean; readonly position: number } {
	const result = runCommand(document, paragraphNavigation(direction, false), {
		anchor: position
	});
	return { applied: result.applied, position: result.selection.main.head };
}

describe('writer commands', () => {
	it('creates Markdown paragraphs in prose and headings', () => {
		expect(applyParagraphBreak('Paragraph')).toEqual({
			applied: true,
			document: 'Paragraph\n\n'
		});
		expect(applyParagraphBreak('# Heading')).toEqual({
			applied: true,
			document: '# Heading\n\n'
		});
		expect(applyParagraphBreak('Heading\n===')).toEqual({
			applied: true,
			document: 'Heading\n===\n\n'
		});
	});

	it('leaves structured Markdown and blank lines to CodeMirror', () => {
		for (const document of ['- List item', '> Quote', '```js\ncode\n```', '    code', '']) {
			expect(applyParagraphBreak(document)).toEqual({ applied: false, document });
		}
	});

	it('returns to the previous paragraph after Enter', () => {
		let state = EditorState.create({
			doc: 'Paragraph',
			selection: { anchor: 9 },
			extensions: [markdown({ base: markdownLanguage })]
		});

		for (const command of [insertParagraphBreak, paragraphNavigation('left', false)]) {
			command({
				state,
				dispatch(transaction) {
					state = transaction.state;
				}
			});
		}

		expect(state.doc.toString()).toBe('Paragraph\n\n');
		expect(state.selection.main.head).toBe(9);
	});

	it('skips Markdown paragraph separators horizontally', () => {
		const document = 'One\n\nTwo';

		expect(cursor(document, 'left', 5)).toEqual({ applied: true, position: 3 });
		expect(cursor(document, 'right', 3)).toEqual({ applied: true, position: 5 });
		expect(cursor(document, 'left', 2)).toEqual({ applied: false, position: 2 });
		expect(cursor(document, 'right', 6)).toEqual({ applied: false, position: 6 });
	});

	it('moves vertically by source offset and clamps to the target paragraph', () => {
		const document = 'Alpha\n\n# Heading\n\nHi';

		expect(cursor(document, 'down', 3)).toEqual({ applied: true, position: 10 });
		expect(cursor(document, 'down', 15)).toEqual({ applied: true, position: 20 });
		expect(cursor(document, 'up', 20)).toEqual({ applied: true, position: 9 });
	});

	it('treats Setext headings as paragraphs', () => {
		const document = 'Paragraph\n\nHeading\n=======\n\nBody';

		expect(cursor(document, 'down', 4)).toEqual({ applied: true, position: 15 });
		expect(cursor(document, 'down', 24)).toEqual({ applied: true, position: 32 });
	});

	it('extends selections using paragraph navigation', () => {
		const result = runCommand('One\n\nTwo', paragraphNavigation('right', true), {
			anchor: 1,
			head: 3
		});

		expect(result.applied).toBe(true);
		expect(result.selection.main.anchor).toBe(1);
		expect(result.selection.main.head).toBe(5);
	});

	it('leaves structured Markdown navigation to CodeMirror', () => {
		for (const [document, position] of [
			['- List item', 3],
			['> Quote', 3],
			['```js\ncode\n```', 7],
			['    code', 5]
		] as const) {
			for (const direction of ['left', 'right', 'up', 'down'] as const) {
				expect(cursor(document, direction, position).applied).toBe(false);
			}
		}
	});

	it('does not trap navigation next to structured blocks', () => {
		const document = 'Paragraph\n\n- List item';

		expect(cursor(document, 'down', 4)).toEqual({ applied: false, position: 4 });
		expect(cursor(document, 'right', 9)).toEqual({ applied: false, position: 9 });
	});

	it('keeps vertical navigation at document boundaries', () => {
		const document = 'Paragraph';

		expect(cursor(document, 'up', 4)).toEqual({ applied: true, position: 4 });
		expect(cursor(document, 'down', 4)).toEqual({ applied: true, position: 4 });
	});
});

describe('formatting commands', () => {
	it('toggles inline formatting on selection (bold, italic, strikethrough, code)', () => {
		const view = createEditorContext('Hello world', { anchor: 6, head: 11 });

		toggleInlineFormat(view, '**');
		expect(view.doc).toBe('Hello **world**');

		// Toggle off
		toggleInlineFormat(view, '**');
		expect(view.doc).toBe('Hello world');
	});

	it('inserts inline formatting at cursor when selection is empty', () => {
		const view = createEditorContext('Hello ', { anchor: 6 });

		toggleInlineFormat(view, '*');
		expect(view.doc).toBe('Hello **');
		expect(view.selection.main.head).toBe(7);
	});

	it('toggles headings level 1 to 6 and places cursor on the right of prefix', () => {
		const emptyView = createEditorContext('', { anchor: 0 });
		toggleHeading(emptyView, 1);
		expect(emptyView.doc).toBe('# ');
		expect(emptyView.selection.main.head).toBe(2);

		// Switch blank heading 1 directly to heading 6
		toggleHeading(emptyView, 6);
		expect(emptyView.doc).toBe('###### ');
		expect(emptyView.selection.main.head).toBe(7);

		// Switch blank heading 6 without trailing space
		const noSpaceHeading = createEditorContext('######', { anchor: 6 });
		toggleHeading(noSpaceHeading, 1);
		expect(noSpaceHeading.doc).toBe('# ');
		expect(noSpaceHeading.selection.main.head).toBe(2);

		// Clear blank heading back to body text
		toggleHeading(noSpaceHeading, 0);
		expect(noSpaceHeading.doc).toBe('');
		expect(noSpaceHeading.selection.main.head).toBe(0);

		const view = createEditorContext('My Heading', { anchor: 0 });

		toggleHeading(view, 1);
		expect(view.doc).toBe('# My Heading');
		expect(view.selection.main.head).toBe(2);

		toggleHeading(view, 5);
		expect(view.doc).toBe('##### My Heading');
		expect(view.selection.main.head).toBe(6);

		toggleHeading(view, 6);
		expect(view.doc).toBe('###### My Heading');
		expect(view.selection.main.head).toBe(7);

		toggleHeading(view, 6);
		expect(view.doc).toBe('My Heading');
		expect(view.selection.main.head).toBe(0);
	});

	it('toggles blockquote on lines and places cursor on the right', () => {
		const emptyView = createEditorContext('', { anchor: 0 });
		toggleBlockquote(emptyView);
		expect(emptyView.doc).toBe('> ');
		expect(emptyView.selection.main.head).toBe(2);

		const view = createEditorContext('Quote text', { anchor: 0 });

		toggleBlockquote(view);
		expect(view.doc).toBe('> Quote text');
		expect(view.selection.main.head).toBe(2);

		toggleBlockquote(view);
		expect(view.doc).toBe('Quote text');
		expect(view.selection.main.head).toBe(0);
	});

	it('toggles bullet list, numbered list, and task checklist and places cursor on the right', () => {
		const emptyBullet = createEditorContext('', { anchor: 0 });
		toggleBulletList(emptyBullet);
		expect(emptyBullet.doc).toBe('- ');
		expect(emptyBullet.selection.main.head).toBe(2);

		const emptyNum = createEditorContext('', { anchor: 0 });
		toggleNumberedList(emptyNum);
		expect(emptyNum.doc).toBe('1. ');
		expect(emptyNum.selection.main.head).toBe(3);

		const emptyTask = createEditorContext('', { anchor: 0 });
		toggleTaskList(emptyTask);
		expect(emptyTask.doc).toBe('- [ ] ');
		expect(emptyTask.selection.main.head).toBe(6);

		const view = createEditorContext('First line\nSecond line', { anchor: 0, head: 15 });

		toggleBulletList(view);
		expect(view.doc).toBe('- First line\n- Second line');

		toggleNumberedList(view);
		expect(view.doc).toBe('1. First line\n2. Second line');

		toggleTaskList(view);
		expect(view.doc).toBe('- [ ] First line\n- [ ] Second line');

		toggleTaskList(view);
		expect(view.doc).toBe('First line\nSecond line');
	});

	it('inserts links with smart selection handling', () => {
		const view1 = createEditorContext('Check example', { anchor: 6, head: 13 });
		insertLink(view1);
		expect(view1.doc).toBe('Check [example](url)');

		const view2 = createEditorContext('Visit https://example.com', { anchor: 6, head: 25 });
		insertLink(view2);
		expect(view2.doc).toBe('Visit [title](https://example.com)');
	});

	it('inserts code blocks and horizontal rules', () => {
		const view = createEditorContext('Snippet', { anchor: 0, head: 7 });
		insertCodeBlock(view);
		expect(view.doc).toBe('```\nSnippet\n```\n');

		const view2 = createEditorContext('Before', { anchor: 6 });
		insertHorizontalRule(view2);
		expect(view2.doc).toContain('---');
	});

	it('inserts auto-incrementing footnotes and definitions with proper formatting', () => {
		// Empty document
		const emptyView = createEditorContext('', { anchor: 0 });
		insertFootnote(emptyView);
		expect(emptyView.doc).toBe('[^1]\n\n[^1]: ');
		expect(emptyView.selection.main.head).toBe(4);

		// With text at cursor
		const view = createEditorContext('Some claim here.', { anchor: 10 });
		insertFootnote(view);
		expect(view.doc).toBe('Some claim[^1] here.\n\n[^1]: ');
		expect(view.selection.main.head).toBe(14);

		// Insert second footnote appends cleanly to definition list
		const view2 = createEditorContext(view.doc, { anchor: 5 });
		insertFootnote(view2);
		expect(view2.doc).toBe('Some [^2]claim[^1] here.\n\n[^1]: \n[^2]: ');

		// With text selection - preserves selected text and inserts footnote after it
		const selectView = createEditorContext('The general relativity concept', {
			anchor: 4,
			head: 22
		});
		insertFootnote(selectView);
		expect(selectView.doc).toBe('The general relativity[^1] concept\n\n[^1]: ');
		expect(selectView.selection.main.head).toBe(26);
	});

	it('strips markdown formatting using stripMarkdownFormatting', () => {
		expect(stripMarkdownFormatting('**bold text**')).toBe('bold text');
		expect(stripMarkdownFormatting('*italic text*')).toBe('italic text');
		expect(stripMarkdownFormatting('~~strike~~')).toBe('strike');
		expect(stripMarkdownFormatting('`code`')).toBe('code');
		expect(stripMarkdownFormatting('# Heading 1')).toBe('Heading 1');
		expect(stripMarkdownFormatting('> Blockquote')).toBe('Blockquote');
		expect(stripMarkdownFormatting('- Bullet item')).toBe('Bullet item');
		expect(stripMarkdownFormatting('1. Numbered item')).toBe('Numbered item');
		expect(stripMarkdownFormatting('- [ ] Task item')).toBe('Task item');
		expect(stripMarkdownFormatting('[link](https://example.com)')).toBe('link');
		expect(stripMarkdownFormatting('![image](https://example.com/img.png)')).toBe('image');
		expect(stripMarkdownFormatting('Note with footnote[^1]')).toBe('Note with footnote');
	});

	it('clears formatting on selection and whole lines', () => {
		const view = createEditorContext('This is **bold** and *italic* text.', {
			anchor: 8,
			head: 16
		});
		clearFormatting(view);
		expect(view.doc).toBe('This is bold and *italic* text.');

		// On whole line when empty selection
		const view2 = createEditorContext('# ## Header title', { anchor: 5 });
		clearFormatting(view2);
		expect(view2.doc).toBe('Header title');
	});

	it('deletes selection or character forward', () => {
		const view = createEditorContext('Hello world', { anchor: 5, head: 11 });
		deleteSelection(view);
		expect(view.doc).toBe('Hello');

		const view2 = createEditorContext('Hello', { anchor: 0 });
		deleteSelection(view2);
		expect(view2.doc).toBe('ello');
	});

	it('defines reader mode preview shortcut in help and shortcuts map', () => {
		expect(APP_SHORTCUTS.preview).toBe('Mod+Alt+P');
		expect(COMMAND_HELP.some((cmd) => cmd.label === 'Toggle reader mode')).toBe(true);
	});

	it('defines new manuscript shortcut in help and shortcuts map', () => {
		expect(APP_SHORTCUTS.newDocument).toBe('Mod+Alt+N');
		expect(COMMAND_HELP.some((cmd) => cmd.label === 'New manuscript')).toBe(true);
	});

	it('defines editor shortcuts for markdown formatting and replace in command help', () => {
		const shortcutsByLabel = new Map(COMMAND_HELP.map((cmd) => [cmd.label, cmd.shortcut]));
		expect(shortcutsByLabel.get('Find & replace')).toBe('Mod+H');
		expect(shortcutsByLabel.get('Inline code')).toBe('Mod+E');
		expect(shortcutsByLabel.get('Strikethrough')).toBe('Mod+Shift+X');
		expect(shortcutsByLabel.get('Code block')).toBe('Mod+Shift+K');
		expect(shortcutsByLabel.get('Heading 1')).toBe('Mod+Alt+1');
		expect(shortcutsByLabel.get('Body text')).toBe('Mod+Alt+0');
		expect(shortcutsByLabel.get('Bullet list')).toBe('Mod+Shift+8');
		expect(shortcutsByLabel.get('Numbered list')).toBe('Mod+Shift+7');
		expect(shortcutsByLabel.get('Task checklist')).toBe('Mod+Shift+C');
		expect(shortcutsByLabel.get('Clear formatting')).toBe('Mod+\\');
	});

	it('indents and unindents lines with indentMore and indentLess', async () => {
		const { indentLess, indentMore } = await import('@codemirror/commands');
		const indented = runCommand('Hello world', indentMore, { anchor: 5 });
		expect(indented.document).toBe('  Hello world');
		expect(indented.selection.main.head).toBe(7);

		const unindented = runCommand('  Hello world', indentLess, { anchor: 7 });
		expect(unindented.document).toBe('Hello world');
		expect(unindented.selection.main.head).toBe(5);
	});
});
