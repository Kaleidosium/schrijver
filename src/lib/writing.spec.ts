import { describe, expect, it } from 'vite-plus/test';
import {
	activeParagraphRange,
	activeSentenceRange,
	calculateDocumentStats,
	calculateSelectionStats,
	countCharacters,
	countCharactersWithoutSpaces,
	countParagraphs,
	countSentences,
	countTasks,
	countWords,
	estimateReadingTime,
	maskMarkdownForProse,
	renderMarkdown
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

	it('masks footnote references and definition prefixes while preserving note content', () => {
		const draft = 'A statement[^1] with context.\n\n[^1]: Footnote details here.';
		const masked = maskMarkdownForProse(draft);

		expect(masked).toHaveLength(draft.length);
		expect(masked).toContain('A statement');
		expect(masked).toContain('with context.');
		expect(masked).toContain('Footnote details here.');
		expect(masked).not.toContain('[^1]');
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

describe('countCharacters', () => {
	it('counts all characters including spaces', () => {
		expect(countCharacters('Hello World')).toBe(11);
		expect(countCharacters('')).toBe(0);
	});
});

describe('countCharactersWithoutSpaces', () => {
	it('counts characters excluding whitespace', () => {
		expect(countCharactersWithoutSpaces('Hello World\n\t!')).toBe(11);
		expect(countCharactersWithoutSpaces('   ')).toBe(0);
	});
});

describe('countSentences', () => {
	it('counts sentences in prose', () => {
		const draft = 'First sentence. Second sentence! Is this the third?';
		expect(countSentences(draft)).toBe(3);
	});

	it('ignores markdown noise and code fences', () => {
		const draft = '# Heading One\n\nFirst sentence.\n```\ncode here.\n```\nSecond sentence.';
		expect(countSentences(draft)).toBe(3);
	});

	it('returns 0 for empty or whitespace text', () => {
		expect(countSentences('')).toBe(0);
		expect(countSentences('   \n\n  ')).toBe(0);
	});
});

describe('countParagraphs', () => {
	it('counts non-empty paragraph blocks', () => {
		const draft = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
		expect(countParagraphs(draft)).toBe(3);
	});

	it('returns 0 for empty drafts', () => {
		expect(countParagraphs('')).toBe(0);
		expect(countParagraphs('\n\n   \n')).toBe(0);
	});
});

describe('countTasks', () => {
	it('detects completed and pending markdown tasks', () => {
		const draft = `
# Tasks
- [ ] First task
- [x] Completed task
* [X] Another completed
1. [ ] Ordered task
- Non-task item
`;
		const stats = countTasks(draft);
		expect(stats.total).toBe(4);
		expect(stats.completed).toBe(2);
		expect(stats.pending).toBe(2);
	});

	it('returns 0 for drafts with no tasks', () => {
		expect(countTasks('Just plain text and a regular - bullet item.')).toEqual({
			total: 0,
			completed: 0,
			pending: 0
		});
	});
});

describe('estimateReadingTime', () => {
	it('estimates reading time using lesetid', () => {
		const shortDraft = 'A short sentence.';
		const estimation = estimateReadingTime(shortDraft);
		expect(estimation.minutes).toBeGreaterThanOrEqual(0);
		expect(typeof estimation.text).toBe('string');
	});
});

describe('calculateDocumentStats', () => {
	it('calculates full document statistics accurately', () => {
		const draft =
			'# Project Title\n\nFirst paragraph with some words.\n\n- [ ] Task 1\n- [x] Task 2';
		const stats = calculateDocumentStats(draft);

		expect(stats.words).toBe(11);
		expect(stats.characters).toBe(draft.length);
		expect(stats.charactersWithoutSpaces).toBe(draft.replace(/\s/g, '').length);
		expect(stats.paragraphs).toBe(3);
		expect(stats.tasks.total).toBe(2);
		expect(stats.tasks.completed).toBe(1);
		expect(stats.tasks.pending).toBe(1);
		expect(stats.readingTime).toBeDefined();
	});
});

describe('calculateSelectionStats', () => {
	it('calculates statistics for highlighted selection', () => {
		const selected = 'Selected words for testing.';
		const stats = calculateSelectionStats(selected);

		expect(stats.words).toBe(4);
		expect(stats.characters).toBe(selected.length);
		expect(stats.charactersWithoutSpaces).toBe(selected.replace(/\s/g, '').length);
		expect(stats.sentences).toBe(1);
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

describe('renderMarkdown', () => {
	it('returns empty string for empty markdown', () => {
		expect(renderMarkdown('')).toBe('');
		expect(renderMarkdown('   ')).toBe('');
	});

	it('renders markdown paragraphs, headings, and lists', () => {
		const md = '# Title\n\nParagraph with **bold** text.\n\n- item 1\n- item 2';
		const html = renderMarkdown(md);

		expect(html).toContain('<h1>Title</h1>');
		expect(html).toContain('<p>Paragraph with <strong>bold</strong> text.</p>');
		expect(html).toContain('<li>item 1</li>');
	});

	it('renders footnote references and definitions as a structured footnotes section', () => {
		const md = 'Statement with note[^1].\n\n[^1]: Footnote content here.';
		const html = renderMarkdown(md);

		expect(html).toContain('<sup><a id="footnote-ref-1" href="#footnote-1" data-footnote-ref');
		expect(html).toContain('<section class="footnotes" data-footnotes>');
		expect(html).toContain('<li id="footnote-1">');
		expect(html).toContain('Footnote content here.');
		expect(html).toContain('data-footnote-backref');
	});

	it('renders multiple footnotes in order of appearance in text', () => {
		const md =
			'Second ref[^beta] and first ref[^alpha].\n\n[^alpha]: Definition alpha\n[^beta]: Definition beta';
		const html = renderMarkdown(md);

		expect(html).toContain(
			'<sup><a id="footnote-ref-beta" href="#footnote-beta" data-footnote-ref'
		);
		expect(html).toContain(
			'<sup><a id="footnote-ref-alpha" href="#footnote-alpha" data-footnote-ref'
		);
		expect(html.indexOf('id="footnote-beta"')).toBeLessThan(html.indexOf('id="footnote-alpha"'));
	});

	it('renders formatting within footnotes', () => {
		const md = 'Text[^1].\n\n[^1]: Note with **bold**, *italic*, and `code`.';
		const html = renderMarkdown(md);

		expect(html).toContain('<strong>bold</strong>');
		expect(html).toContain('<em>italic</em>');
		expect(html).toContain('<code>code</code>');
	});

	it('does not treat code block contents as footnote definitions', () => {
		const md = '```\n[^1]: Not a footnote\n```\n\nReal[^real].\n\n[^real]: Real note.';
		const html = renderMarkdown(md);

		expect(html).toContain('<code>[^1]: Not a footnote\n</code>');
		expect(html).toContain(
			'<sup><a id="footnote-ref-real" href="#footnote-real" data-footnote-ref'
		);
		expect(html).not.toContain('<li id="footnote-1">');
		expect(html).toContain('<li id="footnote-real">');
	});
});
