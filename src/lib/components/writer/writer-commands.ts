import { syntaxTree } from '@codemirror/language';
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
	open: 'Mod+O',
	save: 'Mod+S',
	focus: 'Mod+Shift+F',
	addNote: 'Mod+Shift+M',
	outline: 'Mod+Alt+O',
	review: 'Mod+Alt+R',
	guide: 'Mod+/'
} as const;

export const COMMAND_HELP = [
	{ label: 'Open folder', shortcut: APP_SHORTCUTS.open, scope: 'App' },
	{ label: 'Save folder project', shortcut: APP_SHORTCUTS.save, scope: 'App' },
	{ label: 'Find', shortcut: 'Mod+F', scope: 'Editor' },
	{ label: 'Toggle focus', shortcut: APP_SHORTCUTS.focus, scope: 'App' },
	{ label: 'Add Writer’s Note', shortcut: APP_SHORTCUTS.addNote, scope: 'App' },
	{ label: 'Toggle outline', shortcut: APP_SHORTCUTS.outline, scope: 'App' },
	{ label: 'Toggle style', shortcut: APP_SHORTCUTS.review, scope: 'App' },
	{ label: 'Keyboard shortcuts', shortcut: APP_SHORTCUTS.guide, scope: 'App' },
	{ label: 'Undo', shortcut: 'Mod+Z', scope: 'Editor' },
	{ label: 'Redo', shortcut: 'Mod+Shift+Z', scope: 'Editor' },
	{ label: 'Bold', shortcut: 'Mod+B', scope: 'Editor' },
	{ label: 'Italic', shortcut: 'Mod+I', scope: 'Editor' },
	{ label: 'Link', shortcut: 'Mod+K', scope: 'Editor' }
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
		view.dispatch({ changes, scrollIntoView: true, userEvent: 'input' });
	}

	view.focus?.();
	return true;
}

export function toggleHeading(view: MarkdownEditorContext, level: number): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const targetPrefix = level > 0 ? `${'#'.repeat(level)} ` : '';
		const headingRegex = /^(\s*)#{1,6}\s+/;
		const allAlreadyTarget = lines.every((line) => {
			const text = line.text;
			return level > 0 ? text.startsWith(targetPrefix) : !headingRegex.test(text);
		});

		const changes: ChangeSpec[] = [];

		for (const line of lines) {
			const match = headingRegex.exec(line.text);
			if (allAlreadyTarget) {
				if (match) {
					changes.push({
						from: line.from + (match[1]?.length ?? 0),
						to: line.from + match[0].length,
						insert: ''
					});
				}
			} else if (match) {
				changes.push({
					from: line.from + (match[1]?.length ?? 0),
					to: line.from + match[0].length,
					insert: targetPrefix
				});
			} else if (targetPrefix) {
				const leadingSpaces = /^(\s*)/.exec(line.text)?.[1] ?? '';
				changes.push({ from: line.from + leadingSpaces.length, insert: targetPrefix });
			}
		}

		return changes;
	});
}

export function toggleBlockquote(view: MarkdownEditorContext): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const quoteRegex = /^(\s*)>\s?/;
		const allQuoted = lines.every((line) => quoteRegex.test(line.text));
		const changes: ChangeSpec[] = [];

		for (const line of lines) {
			const match = quoteRegex.exec(line.text);
			if (allQuoted && match) {
				changes.push({
					from: line.from + (match[1]?.length ?? 0),
					to: line.from + match[0].length,
					insert: ''
				});
			} else if (!allQuoted && !match) {
				const leadingSpaces = /^(\s*)/.exec(line.text)?.[1] ?? '';
				changes.push({ from: line.from + leadingSpaces.length, insert: '> ' });
			}
		}

		return changes;
	});
}

export function toggleBulletList(view: MarkdownEditorContext): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const bulletRegex = /^(\s*)[-*+]\s+(?!\[[ xX]\])/;
		const anyListRegex = /^(\s*)(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;
		const allBulleted = lines.every((line) => bulletRegex.test(line.text));
		const changes: ChangeSpec[] = [];

		for (const line of lines) {
			const match = anyListRegex.exec(line.text);
			if (allBulleted) {
				if (match) {
					changes.push({
						from: line.from + (match[1]?.length ?? 0),
						to: line.from + match[0].length,
						insert: ''
					});
				}
			} else if (match) {
				changes.push({
					from: line.from + (match[1]?.length ?? 0),
					to: line.from + match[0].length,
					insert: '- '
				});
			} else {
				const leadingSpaces = /^(\s*)/.exec(line.text)?.[1] ?? '';
				changes.push({ from: line.from + leadingSpaces.length, insert: '- ' });
			}
		}

		return changes;
	});
}

export function toggleNumberedList(view: MarkdownEditorContext): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const numberedRegex = /^(\s*)\d+[.)]\s+/;
		const anyListRegex = /^(\s*)(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;
		const allNumbered = lines.every((line) => numberedRegex.test(line.text));
		const changes: ChangeSpec[] = [];
		let index = 1;

		for (const line of lines) {
			const match = anyListRegex.exec(line.text);
			if (allNumbered) {
				if (match) {
					changes.push({
						from: line.from + (match[1]?.length ?? 0),
						to: line.from + match[0].length,
						insert: ''
					});
				}
			} else if (match) {
				changes.push({
					from: line.from + (match[1]?.length ?? 0),
					to: line.from + match[0].length,
					insert: `${index}. `
				});
				index += 1;
			} else {
				const leadingSpaces = /^(\s*)/.exec(line.text)?.[1] ?? '';
				changes.push({ from: line.from + leadingSpaces.length, insert: `${index}. ` });
				index += 1;
			}
		}

		return changes;
	});
}

export function toggleTaskList(view: MarkdownEditorContext): boolean {
	return applyLinePrefixChanges(view, (lines) => {
		const taskRegex = /^(\s*)(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s+/;
		const anyListRegex = /^(\s*)(?:[-*+]|\d+[.)])\s+/;
		const allTasks = lines.every((line) => taskRegex.test(line.text));
		const changes: ChangeSpec[] = [];

		for (const line of lines) {
			const taskMatch = taskRegex.exec(line.text);
			const listMatch = anyListRegex.exec(line.text);

			if (allTasks && taskMatch) {
				changes.push({
					from: line.from + (taskMatch[1]?.length ?? 0),
					to: line.from + taskMatch[0].length,
					insert: ''
				});
			} else if (taskMatch) {
				const isDone = (taskMatch[2]?.toLowerCase() ?? '') === 'x';
				changes.push({
					from: line.from + (taskMatch[1]?.length ?? 0),
					to: line.from + taskMatch[0].length,
					insert: isDone ? '- [ ] ' : '- [x] '
				});
			} else if (listMatch) {
				changes.push({
					from: line.from + (listMatch[1]?.length ?? 0),
					to: line.from + listMatch[0].length,
					insert: '- [ ] '
				});
			} else {
				const leadingSpaces = /^(\s*)/.exec(line.text)?.[1] ?? '';
				changes.push({ from: line.from + leadingSpaces.length, insert: '- [ ] ' });
			}
		}

		return changes;
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
	const needsNewline =
		endOfDoc > 0 && !docText.endsWith('\n\n') ? (docText.endsWith('\n') ? '\n' : '\n\n') : '';
	const defInsert = `${needsNewline}[^${nextIndex}]: `;

	const changes: ChangeSpec[] = [
		{ from: main.from, to: main.to, insert: refTag },
		{ from: endOfDoc, insert: defInsert }
	];

	view.dispatch({
		changes,
		selection: EditorSelection.cursor(main.from + refTag.length),
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

interface NavigationTarget {
	readonly position: number;
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

	syntaxTree(state).iterate({
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
): NavigationTarget | undefined {
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

	let node = syntaxTree(state).resolveInner(position, position === line.from ? 1 : -1);
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
