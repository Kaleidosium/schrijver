import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import {
	EditorSelection,
	type ChangeSpec,
	type EditorState,
	type StateCommand,
	type Transaction,
	type TransactionSpec
} from '@codemirror/state';
import type { KeyBinding } from '@codemirror/view';

export interface MarkdownEditorContext {
	readonly state: EditorState;
	dispatch(tr: Transaction | TransactionSpec): void;
	focus?(): void;
}

export const APP_SHORTCUTS = {
	newDocument: 'Mod+Alt+N',
	open: 'Mod+O',
	save: 'Mod+S',
	saveAs: 'Mod+Shift+S',
	focus: 'Mod+Shift+F',
	addNote: 'Mod+Shift+M',
	outline: 'Mod+Alt+O',
	review: 'Mod+Alt+R',
	hemingway: 'Alt+H',
	guide: 'Mod+/',
	preview: 'Mod+Alt+P',
	zoomIn: 'Mod+=',
	zoomOut: 'Mod+-',
	zoomReset: 'Mod+0'
} as const;

export const COMMAND_HELP = [
	{ label: 'New manuscript', shortcut: APP_SHORTCUTS.newDocument, scope: 'App' },
	{ label: 'Open folder', shortcut: APP_SHORTCUTS.open, scope: 'App' },
	{ label: 'Save manuscript', shortcut: APP_SHORTCUTS.save, scope: 'App' },
	{ label: 'Save as…', shortcut: APP_SHORTCUTS.saveAs, scope: 'App' },
	{ label: 'Toggle focus', shortcut: APP_SHORTCUTS.focus, scope: 'App' },
	{ label: 'Toggle reader mode', shortcut: APP_SHORTCUTS.preview, scope: 'App' },
	{ label: 'Add note or annotation', shortcut: APP_SHORTCUTS.addNote, scope: 'App' },
	{ label: 'Toggle outline', shortcut: APP_SHORTCUTS.outline, scope: 'App' },
	{ label: 'Toggle style', shortcut: APP_SHORTCUTS.review, scope: 'App' },
	{ label: 'Keyboard shortcuts', shortcut: APP_SHORTCUTS.guide, scope: 'App' },
	{ label: 'Zoom in', shortcut: APP_SHORTCUTS.zoomIn, scope: 'App' },
	{ label: 'Zoom out', shortcut: APP_SHORTCUTS.zoomOut, scope: 'App' },
	{ label: 'Restore default zoom', shortcut: APP_SHORTCUTS.zoomReset, scope: 'App' },
	{ label: 'Undo', shortcut: 'Mod+Z', scope: 'Editor' },
	{ label: 'Redo', shortcut: 'Mod+Shift+Z', scope: 'Editor' },
	{ label: 'Cut', shortcut: 'Mod+X', scope: 'Editor' },
	{ label: 'Copy', shortcut: 'Mod+C', scope: 'Editor' },
	{ label: 'Paste', shortcut: 'Mod+V', scope: 'Editor' },
	{ label: 'Select all', shortcut: 'Mod+A', scope: 'Editor' },
	{ label: 'Find', shortcut: 'Mod+F', scope: 'Editor' },
	{ label: 'Find & replace', shortcut: 'Mod+H', scope: 'Editor' },
	{ label: 'Bold', shortcut: 'Mod+B', scope: 'Editor' },
	{ label: 'Italic', shortcut: 'Mod+I', scope: 'Editor' },
	{ label: 'Inline code', shortcut: 'Mod+E', scope: 'Editor' },
	{ label: 'Strikethrough', shortcut: 'Mod+Shift+X', scope: 'Editor' },
	{ label: 'Link', shortcut: 'Mod+K', scope: 'Editor' },
	{ label: 'Code block', shortcut: 'Mod+Shift+K', scope: 'Editor' },
	{ label: 'Heading 1', shortcut: 'Mod+Alt+1', scope: 'Editor' },
	{ label: 'Heading 2', shortcut: 'Mod+Alt+2', scope: 'Editor' },
	{ label: 'Heading 3', shortcut: 'Mod+Alt+3', scope: 'Editor' },
	{ label: 'Body text', shortcut: 'Mod+Alt+0', scope: 'Editor' },
	{ label: 'Bullet list', shortcut: 'Mod+Shift+8', scope: 'Editor' },
	{ label: 'Numbered list', shortcut: 'Mod+Shift+7', scope: 'Editor' },
	{ label: 'Task checklist', shortcut: 'Mod+Shift+C', scope: 'Editor' },
	{ label: 'Clear formatting', shortcut: 'Mod+\\', scope: 'Editor' },
	{ label: 'Indent line', shortcut: 'Tab', scope: 'Editor' },
	{ label: 'Unindent line', shortcut: 'Shift+Tab', scope: 'Editor' }
] as const;

export function toggleInlineFormat(
	view: MarkdownEditorContext,
	open: string,
	close = open
): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const doc = view.state.doc;
	const transaction = view.state.changeByRange((range) => {
		if (range.empty) {
			const before = doc.sliceString(Math.max(0, range.from - open.length), range.from);
			const after = doc.sliceString(range.to, Math.min(doc.length, range.to + close.length));

			if (before === open && after === close) {
				return {
					changes: [
						{ from: range.from - open.length, to: range.from, insert: '' },
						{ from: range.to, to: range.to + close.length, insert: '' }
					],
					range: EditorSelection.cursor(range.from - open.length)
				};
			}

			return {
				changes: [
					{ from: range.from, insert: open },
					{ from: range.to, insert: close }
				],
				range: EditorSelection.cursor(range.from + open.length)
			};
		}

		const selected = doc.sliceString(range.from, range.to);

		if (
			selected.startsWith(open) &&
			selected.endsWith(close) &&
			selected.length >= open.length + close.length
		) {
			const unwrapped = selected.slice(open.length, selected.length - close.length);
			return {
				changes: { from: range.from, to: range.to, insert: unwrapped },
				range: EditorSelection.range(range.from, range.from + unwrapped.length)
			};
		}

		const before = doc.sliceString(Math.max(0, range.from - open.length), range.from);
		const after = doc.sliceString(range.to, Math.min(doc.length, range.to + close.length));

		if (before === open && after === close) {
			return {
				changes: [
					{ from: range.from - open.length, to: range.from, insert: '' },
					{ from: range.to, to: range.to + close.length, insert: '' }
				],
				range: EditorSelection.range(range.from - open.length, range.to - open.length)
			};
		}

		return {
			changes: [
				{ from: range.from, insert: open },
				{ from: range.to, insert: close }
			],
			range: EditorSelection.range(range.from + open.length, range.to + open.length)
		};
	});

	view.dispatch(transaction);
	view.focus?.();
	return true;
}

function applyLinePrefixChanges(
	view: MarkdownEditorContext,
	computeChanges: (lines: ReturnType<typeof getSelectedLines>) => ChangeSpec[]
): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const lines = getSelectedLines(view);
	const changes = computeChanges(lines);

	if (changes.length > 0) {
		const changeSet = view.state.changes(changes);
		const selection = view.state.selection.map(changeSet, 1);
		view.dispatch({
			changes: changeSet,
			selection,
			scrollIntoView: true,
			userEvent: 'input'
		});
	}

	view.focus?.();
	return true;
}

const ANY_LIST_RE = /^(\s*)(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;

function toggleList(
	view: MarkdownEditorContext,
	itemRegex: RegExp,
	getItemPrefix: (index: number) => string
): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const allMatch = lines.every((line) => itemRegex.test(line.text));
		let index = 1;
		return lines.map((line) => {
			const match = (allMatch ? itemRegex : ANY_LIST_RE).exec(line.text);
			const leading = match
				? (match[1]?.length ?? 0)
				: (/^(\s*)/.exec(line.text)?.[1]?.length ?? 0);
			const to = match ? line.from + match[0].length : line.from + leading;
			const insert = allMatch ? '' : getItemPrefix(index++);
			return { from: line.from + leading, to, insert };
		});
	});
}

export function toggleHeading(view: MarkdownEditorContext, level: number): boolean {
	const targetPrefix = level > 0 ? `${'#'.repeat(level)} ` : '';
	const headingRegex = /^(\s*)#{1,6}(?:\s+|$)/;
	return applyLinePrefixChanges(view, (lines) => {
		const allTarget = lines.every((line) =>
			level > 0 ? line.text.startsWith(targetPrefix) : !headingRegex.test(line.text)
		);
		return lines.map((line) => {
			const match = headingRegex.exec(line.text);
			const leading = match
				? (match[1]?.length ?? 0)
				: (/^(\s*)/.exec(line.text)?.[1]?.length ?? 0);
			const to = match ? line.from + match[0].length : line.from + leading;
			return { from: line.from + leading, to, insert: allTarget ? '' : targetPrefix };
		});
	});
}

export function toggleBlockquote(view: MarkdownEditorContext): boolean {
	const quoteRegex = /^(\s*)>\s?/;
	return applyLinePrefixChanges(view, (lines) => {
		const allQuoted = lines.every((line) => quoteRegex.test(line.text));
		return lines.map((line) => {
			const match = quoteRegex.exec(line.text);
			const leading = match
				? (match[1]?.length ?? 0)
				: (/^(\s*)/.exec(line.text)?.[1]?.length ?? 0);
			const to = match ? line.from + match[0].length : line.from + leading;
			return { from: line.from + leading, to, insert: allQuoted ? '' : '> ' };
		});
	});
}

export function toggleBulletList(view: MarkdownEditorContext): boolean {
	return toggleList(view, /^(\s*)[-*+]\s+(?!\[[ xX]\])/, () => '- ');
}

export function toggleNumberedList(view: MarkdownEditorContext): boolean {
	return toggleList(view, /^(\s*)\d+[.)]\s+/, (index) => `${index}. `);
}

export function toggleTaskList(view: MarkdownEditorContext): boolean {
	const taskRegex = /^(\s*)(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+/;
	return applyLinePrefixChanges(view, (lines) => {
		const allTasks = lines.every((line) => taskRegex.test(line.text));
		return lines.map((line) => {
			const taskMatch = taskRegex.exec(line.text);
			const listMatch = taskMatch ?? /^(\s*)(?:[-*+]|\d+[.)])\s+/.exec(line.text);
			const leading = listMatch
				? (listMatch[1]?.length ?? 0)
				: (/^(\s*)/.exec(line.text)?.[1]?.length ?? 0);
			const to = listMatch ? line.from + listMatch[0].length : line.from + leading;
			let insert = '';
			if (!allTasks) {
				insert = taskMatch ? (taskMatch[2]?.toLowerCase() === 'x' ? '- [ ] ' : '- [x] ') : '- [ ] ';
			}
			return { from: line.from + leading, to, insert };
		});
	});
}

export function insertLink(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const main = view.state.selection.main;
	const selected = view.state.doc.sliceString(main.from, main.to);
	const isUrl = /^https?:\/\//i.test(selected);

	let replacement: string;
	let selectionOffset: { anchor: number; head: number };

	if (main.empty) {
		replacement = '[title](url)';
		selectionOffset = { anchor: main.from + 1, head: main.from + 6 };
	} else if (isUrl) {
		replacement = `[title](${selected})`;
		selectionOffset = { anchor: main.from + 1, head: main.from + 6 };
	} else {
		replacement = `[${selected}](url)`;
		const urlStart = main.from + selected.length + 3;
		selectionOffset = { anchor: urlStart, head: urlStart + 3 };
	}

	view.dispatch({
		changes: { from: main.from, to: main.to, insert: replacement },
		selection: EditorSelection.range(selectionOffset.anchor, selectionOffset.head),
		scrollIntoView: true,
		userEvent: 'input'
	});

	view.focus?.();
	return true;
}

export function insertCodeBlock(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const main = view.state.selection.main;
	const selected = view.state.doc.sliceString(main.from, main.to);

	if (main.empty) {
		const insert = '```\n\n```\n';
		view.dispatch({
			changes: { from: main.from, insert },
			selection: EditorSelection.cursor(main.from + 4),
			scrollIntoView: true,
			userEvent: 'input'
		});
	} else {
		const insert = `\`\`\`\n${selected}\n\`\`\`\n`;
		view.dispatch({
			changes: { from: main.from, to: main.to, insert },
			selection: EditorSelection.range(main.from + 4, main.from + 4 + selected.length),
			scrollIntoView: true,
			userEvent: 'input'
		});
	}

	view.focus?.();
	return true;
}

export function insertHorizontalRule(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const main = view.state.selection.main;
	const doc = view.state.doc;
	const currentLine = doc.lineAt(main.head);
	const needsNewlineBefore = currentLine.from !== main.head && currentLine.text.length > 0;
	const insert = `${needsNewlineBefore ? '\n' : ''}\n---\n\n`;

	view.dispatch({
		changes: { from: main.from, to: main.to, insert },
		selection: EditorSelection.cursor(main.from + insert.length),
		scrollIntoView: true,
		userEvent: 'input'
	});

	view.focus?.();
	return true;
}

export function insertFootnote(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const doc = view.state.doc;
	const docText = doc.toString();
	const main = view.state.selection.main;

	let maxIndex = 0;

	for (const match of docText.matchAll(/\[\^(\d+)\]/g)) {
		const num = parseInt(match[1] ?? '0', 10);
		if (num > maxIndex) {
			maxIndex = num;
		}
	}

	const nextIndex = maxIndex + 1;
	const refTag = `[^${nextIndex}]`;
	const endOfDoc = doc.length;
	const insertPos = main.to;

	let defPrefix: string;
	if (docText.trim() === '') {
		defPrefix = '\n\n';
	} else if (/\[\^\d+\]:[^\n]*\s*$/.test(docText)) {
		defPrefix = docText.endsWith('\n') ? '' : '\n';
	} else if (docText.endsWith('\n\n')) {
		defPrefix = '';
	} else if (docText.endsWith('\n')) {
		defPrefix = '\n';
	} else {
		defPrefix = '\n\n';
	}

	const defInsert = `${defPrefix}[^${nextIndex}]: `;

	const changes: ChangeSpec[] = [
		{ from: insertPos, insert: refTag },
		{ from: endOfDoc, insert: defInsert }
	];

	view.dispatch({
		changes,
		selection: EditorSelection.cursor(insertPos + refTag.length),
		scrollIntoView: true,
		userEvent: 'input'
	});

	view.focus?.();
	return true;
}

function getSelectedLines(view: MarkdownEditorContext): Array<{
	readonly from: number;
	readonly to: number;
	readonly number: number;
	readonly text: string;
}> {
	const doc = view.state.doc;
	const lineNumbers = new Set<number>();
	const lines: Array<{
		readonly from: number;
		readonly to: number;
		readonly number: number;
		readonly text: string;
	}> = [];

	for (const range of view.state.selection.ranges) {
		const startLine = doc.lineAt(range.from).number;
		const endLine = doc.lineAt(range.to).number;

		for (let lineNum = startLine; lineNum <= endLine; lineNum += 1) {
			if (!lineNumbers.has(lineNum)) {
				lineNumbers.add(lineNum);
				const line = doc.line(lineNum);
				lines.push({ from: line.from, to: line.to, number: line.number, text: line.text });
			}
		}
	}

	return lines;
}

export const insertParagraphBreak: StateCommand = ({ state, dispatch }) => {
	if (
		state.readOnly ||
		!state.selection.ranges.every((range) => isProseOrHeading(state, range.head))
	) {
		return false;
	}

	const changes = state.changeByRange((range) => ({
		changes: { from: range.from, to: range.to, insert: '\n\n' },
		range: EditorSelection.cursor(range.from + 2)
	}));

	dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
	return true;
};

type ParagraphDirection = 'left' | 'right' | 'up' | 'down';

interface MarkdownBlock {
	readonly eligible: boolean;
	readonly from: number;
	readonly to: number;
}

export function paragraphNavigation(direction: ParagraphDirection, extend: boolean): StateCommand {
	return ({ state, dispatch }) => {
		if (!extend && state.selection.ranges.some((range) => !range.empty)) {
			return false;
		}

		const blocks = topLevelBlocks(state);
		const targets = state.selection.ranges.map((range) =>
			navigationTarget(state, blocks, range.head, direction)
		);

		if (targets.some((target) => target === undefined)) {
			return false;
		}

		const selection = EditorSelection.create(
			state.selection.ranges.map((range, index) => {
				const target = targets[index];

				if (!target) {
					return range;
				}

				return extend
					? EditorSelection.range(range.anchor, target.position)
					: EditorSelection.cursor(target.position);
			}),
			state.selection.mainIndex
		);

		if (!selection.eq(state.selection)) {
			dispatch(state.update({ selection, scrollIntoView: true, userEvent: 'select' }));
		}

		return true;
	};
}

export const paragraphNavigationKeymap: readonly KeyBinding[] = [
	{
		key: 'ArrowLeft',
		run: paragraphNavigation('left', false),
		shift: paragraphNavigation('left', true)
	},
	{
		key: 'ArrowRight',
		run: paragraphNavigation('right', false),
		shift: paragraphNavigation('right', true)
	},
	{
		key: 'ArrowUp',
		run: paragraphNavigation('up', false),
		shift: paragraphNavigation('up', true)
	},
	{
		key: 'ArrowDown',
		run: paragraphNavigation('down', false),
		shift: paragraphNavigation('down', true)
	}
];

function topLevelBlocks(state: EditorState): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	const tree = ensureSyntaxTree(state, state.doc.length, 5000) ?? syntaxTree(state);

	tree.iterate({
		enter(node) {
			if (node.node.parent?.name !== 'Document') {
				return;
			}

			blocks.push({
				eligible: node.name === 'Paragraph' || /^(?:ATX|Setext)Heading[1-6]$/.test(node.name),
				from: node.from,
				to: node.to
			});
			return false;
		}
	});

	return blocks;
}

function navigationTarget(
	state: EditorState,
	blocks: readonly MarkdownBlock[],
	position: number,
	direction: ParagraphDirection
): { readonly position: number } | undefined {
	const index = blocks.findIndex((block) => block.from <= position && position <= block.to);

	if (index >= 0) {
		const block = blocks[index];

		if (!block?.eligible) {
			return;
		}

		if (direction === 'left' && position !== block.from) {
			return;
		}

		if (direction === 'right' && position !== block.to) {
			return;
		}

		const neighborIndex = index + (direction === 'left' || direction === 'up' ? -1 : 1);
		const neighbor = blocks[neighborIndex];

		if (!neighbor) {
			return { position };
		}

		if (!neighbor.eligible) {
			return;
		}

		if (direction === 'left') {
			return { position: neighbor.to };
		}

		if (direction === 'right') {
			return { position: neighbor.from };
		}

		const offset = Math.min(position - block.from, neighbor.to - neighbor.from);
		return { position: neighbor.from + offset };
	}

	const previousIndex = blocks.findLastIndex((block) => block.to < position);
	const nextIndex = blocks.findIndex((block) => block.from > position);
	const previous = blocks[previousIndex];
	const next = blocks[nextIndex];

	if (
		(previous && state.doc.sliceString(previous.to, position).trim()) ||
		(next && state.doc.sliceString(position, next.from).trim())
	) {
		return;
	}

	const target = direction === 'left' || direction === 'up' ? previous : next;

	if (!target?.eligible) {
		return target ? undefined : { position };
	}

	return {
		position: direction === 'left' ? target.to : target.from
	};
}

function isProseOrHeading(state: EditorState, position: number): boolean {
	const line = state.doc.lineAt(position);

	if (!line.text.trim()) {
		return false;
	}

	const tree = ensureSyntaxTree(state, state.doc.length, 5000) ?? syntaxTree(state);
	let node = tree.resolveInner(position, position === line.from ? 1 : -1);
	let paragraph = false;

	for (;;) {
		if (/^(?:ATX|Setext)Heading[1-6]$/.test(node.name)) {
			return true;
		}

		if (node.name === 'Paragraph') {
			paragraph = true;
		}

		if (
			node.name === 'ListItem' ||
			node.name === 'BulletList' ||
			node.name === 'OrderedList' ||
			node.name === 'Blockquote' ||
			node.name === 'FencedCode' ||
			node.name === 'CodeBlock'
		) {
			return false;
		}

		if (!node.parent) {
			break;
		}

		node = node.parent;
	}

	return paragraph;
}

export function stripMarkdownFormatting(text: string): string {
	return text
		.replace(/\[\^[^\]]+\]:?/g, '')
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^(?:#{1,6}\s*)+/gm, '')
		.replace(/^>\s?/gm, '')
		.replace(/^(\s*)(?:[-*+]|\d+[.)])\s+\[[ xX]\]\s+/gm, '$1')
		.replace(/^(\s*)(?:[-*+]|\d+[.)])\s+/gm, '$1')
		.replace(/(\*\*|__|\*|_|~~|`)/g, '');
}

export function clearFormatting(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const doc = view.state.doc;
	const { main } = view.state.selection;

	if (main.empty) {
		const line = doc.lineAt(main.head);
		const stripped = stripMarkdownFormatting(line.text);
		if (stripped === line.text) {
			return false;
		}
		view.dispatch({
			changes: { from: line.from, to: line.to, insert: stripped },
			scrollIntoView: true,
			userEvent: 'input'
		});
	} else {
		const selected = doc.sliceString(main.from, main.to);
		const stripped = stripMarkdownFormatting(selected);
		view.dispatch({
			changes: { from: main.from, to: main.to, insert: stripped },
			selection: EditorSelection.range(main.from, main.from + stripped.length),
			scrollIntoView: true,
			userEvent: 'input'
		});
	}

	view.focus?.();
	return true;
}

export function deleteSelection(view: MarkdownEditorContext): boolean {
	if (view.state.readOnly) {
		return false;
	}

	const { main } = view.state.selection;
	const from = main.from;
	const to = main.empty ? Math.min(view.state.doc.length, main.head + 1) : main.to;

	if (from === to && main.empty) {
		return false;
	}

	view.dispatch({
		changes: { from, to, insert: '' },
		selection: EditorSelection.cursor(from),
		scrollIntoView: true,
		userEvent: 'delete'
	});
	view.focus?.();
	return true;
}
