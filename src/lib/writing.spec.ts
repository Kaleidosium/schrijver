import { describe, expect, it } from 'vite-plus/test';
import { activeParagraphRange, countWords } from './writing';

describe('countWords', () => {
	it('counts plain prose words', () => {
		expect(countWords('One small draft, revised twice.')).toBe(5);
	});

	it('ignores code and keeps link labels', () => {
		expect(countWords('Read [the note](https://example.com), not `utilize()`.')).toBe(4);
	});

	it('returns zero for empty drafts', () => {
		expect(countWords('')).toBe(0);
	});
});

describe('activeParagraphRange', () => {
	it('returns an empty range for an empty draft', () => {
		expect(activeParagraphRange('', 0)).toEqual({ from: 0, to: 0 });
	});

	it('finds the first paragraph', () => {
		const draft = 'First line\nstill first\n\nSecond paragraph';

		expect(activeParagraphRange(draft, 4)).toEqual({ from: 0, to: 22 });
	});

	it('finds the second paragraph', () => {
		const draft = 'First paragraph\n\nSecond paragraph';

		expect(activeParagraphRange(draft, draft.length)).toEqual({ from: 17, to: 33 });
	});

	it('uses the blank line when the cursor is between paragraphs', () => {
		const draft = 'First paragraph\n\nSecond paragraph';

		expect(activeParagraphRange(draft, 16)).toEqual({ from: 16, to: 16 });
	});
});
