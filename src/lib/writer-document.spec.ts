import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vite-plus/test';
import {
	fallbackFileNames,
	hashText,
	normalizeMarkdownFileName,
	outlineItems,
	parseRecovery,
	parseSidecar,
	resolveTextSelector,
	sidecarName
} from './writer-document';

function markdownState(document: string): EditorState {
	return EditorState.create({
		doc: document,
		extensions: [markdown({ base: markdownLanguage })]
	});
}

describe('writer document helpers', () => {
	it('extracts headings from extended Markdown', () => {
		const state = markdownState('# One\n\nParagraph.\n\n## Two *words*\n\n> Quoted paragraph');

		expect(outlineItems(state)).toEqual([
			{ id: '0:1', level: 1, from: 0, label: 'One' },
			{ id: '19:2', level: 2, from: 19, label: 'Two words' }
		]);
	});

	it('validates sidecars and recovery journals', () => {
		const sidecar = {
			version: 1,
			projectId: 'project',
			markdownFile: 'old.md',
			notes: [
				{
					id: 'note',
					body: 'Revise this.',
					createdAt: '2026-06-23T00:00:00.000Z',
					updatedAt: '2026-06-23T00:00:00.000Z',
					resolved: false,
					selection: { from: 0, to: 5, quote: 'Draft' }
				}
			]
		};
		const journal = {
			version: 1,
			markdown: 'Draft',
			fileName: 'draft.md',
			baselineHash: hashText('Saved'),
			sidecar,
			context: {
				anchor: 2,
				head: 2,
				scrollTop: 10,
				outlineOpen: true,
				notesOpen: false
			},
			updatedAt: '2026-06-23T00:00:00.000Z',
			revision: 2
		};

		expect(parseSidecar(sidecar, 'draft.md').markdownFile).toBe('draft.md');
		expect(parseSidecar(sidecar, 'draft.md').notes[0]?.selection?.quote).toBe('Draft');
		expect(parseRecovery(JSON.stringify(journal))?.markdown).toBe('Draft');
		expect(parseRecovery('{bad json')).toBeUndefined();
		expect(sidecarName('essay.md')).toBe('essay.schrijver.json');
		expect(() =>
			parseSidecar(
				{
					...sidecar,
					notes: [{ ...sidecar.notes[0], selection: { from: 0, to: 10, quote: 'mismatch' } }]
				},
				'draft.md'
			)
		).toThrow('Invalid note text selection');
	});

	it('supports anchor-less notes in sidecar files', () => {
		const sidecar = {
			version: 1,
			projectId: 'project',
			markdownFile: 'notes.md',
			notes: [
				{
					id: 'anchorless-note',
					body: 'General document thought.',
					createdAt: '2026-06-23T00:00:00.000Z',
					updatedAt: '2026-06-23T00:00:00.000Z',
					resolved: false
				}
			]
		};

		const parsed = parseSidecar(sidecar, 'notes.md');
		expect(parsed.notes).toHaveLength(1);
		expect(parsed.notes[0]?.body).toBe('General document thought.');
		expect(parsed.notes[0]?.selection).toBeUndefined();
	});

	it('restores exact text selections and uses bounded local search', () => {
		const document = 'First repeated phrase. Later repeated phrase.';

		expect(resolveTextSelector({ from: 6, to: 21, quote: 'repeated phrase' }, document)).toEqual({
			from: 6,
			to: 21
		});
		expect(resolveTextSelector({ from: 35, to: 50, quote: 'repeated phrase' }, document)).toEqual({
			from: 29,
			to: 44
		});
	});

	it('does not jump to distant repeated phrases when text is deleted or far away', () => {
		const document = 'A'.repeat(400) + '\n\nDistant paragraph with Introduction sentence here.';

		// The sentence was deleted near offset 0, and the only other instance is 400+ chars away
		expect(
			resolveTextSelector({ from: 0, to: 27, quote: 'Introduction sentence here.' }, document)
		).toBeUndefined();
	});

	it('disambiguates identical phrases using prefix and suffix context', () => {
		const document = 'The small cat jumped. The big cat jumped.';
		const selectorWithPrefix = {
			from: 0,
			to: 20,
			quote: 'cat jumped',
			prefix: 'The big '
		};

		// Should match the second occurrence because prefix matches 'The big '
		expect(resolveTextSelector(selectorWithPrefix, document)).toEqual({
			from: 30,
			to: 40
		});
	});

	it('returns undefined for collapsed selections', () => {
		const document = 'Some document text.';
		expect(resolveTextSelector({ from: 5, to: 5, quote: 'deleted' }, document)).toBeUndefined();
	});

	it('creates matching, collision-resistant fallback file names', () => {
		const first = fallbackFileNames('essay.md', new Date('2026-06-24T14:30:22.123Z'));
		const second = fallbackFileNames('essay.md', new Date('2026-06-24T14:30:22.124Z'));

		expect(first).toEqual({
			markdown: 'essay-2026-06-24-14-30-22-123Z.md',
			sidecar: 'essay-2026-06-24-14-30-22-123Z.schrijver.json'
		});
		expect(second.markdown).not.toBe(first.markdown);
		expect(normalizeMarkdownFileName('notes')).toBe('notes.md');
		expect(() => normalizeMarkdownFileName('../notes')).toThrow('valid file name');
	});
});
