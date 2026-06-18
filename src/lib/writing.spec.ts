import { describe, expect, it } from 'vite-plus/test';
import {
	activeParagraphRange,
	activeSentenceRange,
	countWords,
	maskMarkdownForProse
} from './writing';

describe('maskMarkdownForProse', () => {
	it('keeps length while masking heading and emphasis markers', () => {
		const draft = '# A **quiet** heading';
		const masked = maskMarkdownForProse(draft);

		expect(masked).toHaveLength(draft.length);
		expect(masked).toContain('A');
		expect(masked).toContain('quiet');
		expect(masked).toContain('heading');
		expect(masked).not.toContain('#');
		expect(masked).not.toContain('*');
	});

	it('keeps link labels and masks urls and images', () => {
		const draft = 'Read [the note](https://example.com) and ![alt text](image.png).';
		const masked = maskMarkdownForProse(draft);

		expect(masked).toHaveLength(draft.length);
		expect(masked).toContain('the note');
		expect(masked).not.toContain('https');
		expect(masked).not.toContain('alt text');
		expect(masked).not.toContain('image.png');
	});

	it('masks inline and fenced code', () => {
		const draft = 'Use `const value = 1` here.\n```js\nconst secret = true\n```\nThen write.';
		const masked = maskMarkdownForProse(draft);

		expect(masked).toHaveLength(draft.length);
		expect(masked).toContain('Use');
		expect(masked).toContain('Then write');
		expect(masked).not.toContain('const');
		expect(masked).not.toContain('secret');
	});

	it('masks list markers, task boxes, and horizontal rules', () => {
		const draft = '- [x] Finish draft\n\n___\n---\n***';
		const masked = maskMarkdownForProse(draft);

		expect(masked).toHaveLength(draft.length);
		expect(masked).toContain('Finish draft');
		expect(masked).not.toContain('[x]');
		expect(masked).not.toContain('___');
		expect(masked).not.toContain('---');
		expect(masked).not.toContain('***');
	});
});

describe('countWords', () => {
	it('counts plain prose words', () => {
		expect(countWords('One small draft, revised twice.')).toBe(5);
	});

	it('ignores code and keeps link labels', () => {
		expect(countWords('Read [the note](https://example.com), not `utilize()`.')).toBe(4);
	});

	it('ignores markdown markers, images, and horizontal rules', () => {
		expect(countWords('# Title\n\n- [ ] Write **one** line\n\n![alt](image.png)\n\n---')).toBe(4);
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

describe('activeSentenceRange', () => {
	it('finds the sentence containing the cursor', () => {
		const draft = 'First sentence. Second sentence!';

		expect(activeSentenceRange(draft, 20)).toEqual({ from: 16, to: 32 });
	});

	it('keeps markdown markers outside the active prose', () => {
		const draft = '# A linked [sentence](https://example.com). Another one.';

		expect(activeSentenceRange(draft, 8)).toEqual({ from: 2, to: 43 });
	});

	it('uses the blank line between paragraphs', () => {
		const draft = 'First sentence.\n\nSecond sentence.';

		expect(activeSentenceRange(draft, 16)).toEqual({ from: 16, to: 16 });
	});
});
