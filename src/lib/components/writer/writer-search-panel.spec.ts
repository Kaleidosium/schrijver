import { SearchQuery } from '@codemirror/search';
import { EditorSelection, EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vite-plus/test';
import { calculateMatchStats } from './writer-search-panel';

describe('writer-search-panel', () => {
	describe('calculateMatchStats', () => {
		it('returns 0/0 for empty query', () => {
			const state = EditorState.create({ doc: 'Hello world! Hello again.' });
			const query = new SearchQuery({ search: '' });
			const stats = calculateMatchStats(state, query);

			expect(stats).toEqual({ current: 0, total: 0 });
		});

		it('returns 0/0 for query with no matches', () => {
			const state = EditorState.create({ doc: 'The quick brown fox' });
			const query = new SearchQuery({ search: 'zebra' });
			const stats = calculateMatchStats(state, query);

			expect(stats).toEqual({ current: 0, total: 0 });
		});

		it('calculates total matches correctly', () => {
			const state = EditorState.create({ doc: 'apple banana apple cherry apple' });
			const query = new SearchQuery({ search: 'apple' });
			const stats = calculateMatchStats(state, query);

			expect(stats).toEqual({ current: 0, total: 3 });
		});

		it('detects current match when selection is exactly on a match', () => {
			const doc = 'apple banana apple cherry apple';
			// second "apple" starts at index 13, ends at index 18
			const state = EditorState.create({
				doc,
				selection: EditorSelection.single(13, 18)
			});
			const query = new SearchQuery({ search: 'apple' });
			const stats = calculateMatchStats(state, query);

			expect(stats).toEqual({ current: 2, total: 3 });
		});

		it('detects current match when selection cursor is inside a match range', () => {
			const doc = 'apple banana apple cherry apple';
			// selection inside first apple
			const state = EditorState.create({
				doc,
				selection: EditorSelection.single(1, 4)
			});
			const query = new SearchQuery({ search: 'apple' });
			const stats = calculateMatchStats(state, query);

			expect(stats).toEqual({ current: 1, total: 3 });
		});

		it('handles case sensitive searches', () => {
			const doc = 'Word word WORD Word';
			const state = EditorState.create({ doc });

			const caseQuery = new SearchQuery({ search: 'Word', caseSensitive: true });
			const caseStats = calculateMatchStats(state, caseQuery);
			expect(caseStats).toEqual({ current: 0, total: 2 });

			const insensitiveQuery = new SearchQuery({ search: 'Word', caseSensitive: false });
			const insensitiveStats = calculateMatchStats(state, insensitiveQuery);
			expect(insensitiveStats).toEqual({ current: 0, total: 4 });
		});

		it('handles whole word searches', () => {
			const doc = 'the theater other the';
			const state = EditorState.create({ doc });

			const wordQuery = new SearchQuery({ search: 'the', wholeWord: true });
			const wordStats = calculateMatchStats(state, wordQuery);
			expect(wordStats).toEqual({ current: 0, total: 2 });

			const substringQuery = new SearchQuery({ search: 'the', wholeWord: false });
			const substringStats = calculateMatchStats(state, substringQuery);
			expect(substringStats).toEqual({ current: 0, total: 4 });
		});

		it('handles regex searches', () => {
			const doc = 'item1, item24, item300, not_item';
			const state = EditorState.create({ doc });

			const regexQuery = new SearchQuery({ search: 'item\\d+', regexp: true });
			const regexStats = calculateMatchStats(state, regexQuery);
			expect(regexStats).toEqual({ current: 0, total: 3 });
		});

		it('handles invalid regex without crashing', () => {
			const doc = 'Some text [unclosed bracket';
			const state = EditorState.create({ doc });

			const invalidRegexQuery = new SearchQuery({ search: '[unclosed', regexp: true });
			const stats = calculateMatchStats(state, invalidRegexQuery);
			expect(stats).toEqual({ current: 0, total: 0 });
		});
	});
});
