import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorSelection, EditorState, type StateCommand } from '@codemirror/state';
import { describe, expect, it } from 'vite-plus/test';
import { insertParagraphBreak, paragraphNavigation } from './writer-commands';

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
