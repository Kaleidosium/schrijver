import { syntaxTree } from '@codemirror/language';
import {
	EditorSelection,
	type ChangeSpec,
	type EditorState,
	type StateCommand
} from '@codemirror/state';
import type { EditorView, KeyBinding } from '@codemirror/view';

export const APP_SHORTCUTS = {
	open: 'Mod+O',
	save: 'Mod+S',
	focus: 'Mod+Shift+F',
	addNote: 'Mod+Shift+M',
	outline: 'Mod+Alt+O',
	review: 'Mod+Alt+R',
	guide: 'Mod+/'
} as const;

export interface CommandHelp {
	readonly label: string;
	readonly scope: 'App' | 'Editor';
	readonly shortcut: string;
}

export const COMMAND_HELP: readonly CommandHelp[] = [
	{ label: 'Open folder', shortcut: APP_SHORTCUTS.open, scope: 'App' },
	{ label: 'Save folder project', shortcut: APP_SHORTCUTS.save, scope: 'App' },
	{ label: 'Find', shortcut: 'Mod+F', scope: 'Editor' },
	{ label: 'Toggle focus', shortcut: APP_SHORTCUTS.focus, scope: 'App' },
	{ label: 'Add Writer’s Note', shortcut: APP_SHORTCUTS.addNote, scope: 'App' },
	{ label: 'Toggle outline', shortcut: APP_SHORTCUTS.outline, scope: 'App' },
	{ label: 'Toggle review', shortcut: APP_SHORTCUTS.review, scope: 'App' },
	{ label: 'Keyboard shortcuts', shortcut: APP_SHORTCUTS.guide, scope: 'App' },
	{ label: 'Undo', shortcut: 'Mod+Z', scope: 'Editor' },
	{ label: 'Redo', shortcut: 'Mod+Shift+Z', scope: 'Editor' },
	{ label: 'Bold', shortcut: 'Mod+B', scope: 'Editor' },
	{ label: 'Italic', shortcut: 'Mod+I', scope: 'Editor' },
	{ label: 'Link', shortcut: 'Mod+K', scope: 'Editor' }
];

export function wrapSelection(view: EditorView, open: string, close: string): boolean {
	const transaction = view.state.changeByRange((range) => {
		const selected = view.state.doc.sliceString(range.from, range.to);
		const changes: ChangeSpec[] = [
			{ from: range.from, insert: open },
			{ from: range.to, insert: close }
		];
		const from = range.from + open.length;

		return {
			changes,
			range: range.empty
				? EditorSelection.cursor(from)
				: EditorSelection.range(from, from + selected.length)
		};
	});

	view.dispatch(transaction);
	return true;
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
