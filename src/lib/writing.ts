import { estimate } from 'lesetid';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';

export interface TextRange {
	from: number;
	to: number;
}

export interface TaskStats {
	readonly total: number;
	readonly completed: number;
	readonly pending: number;
}

export interface DocumentStats {
	readonly words: number;
	readonly characters: number;
	readonly charactersWithoutSpaces: number;
	readonly sentences: number;
	readonly paragraphs: number;
	readonly readingTime: string;
	readonly readingTimeMinutes: number;
	readonly tasks: TaskStats;
}

export interface SelectionStats {
	readonly words: number;
	readonly characters: number;
	readonly charactersWithoutSpaces: number;
	readonly sentences: number;
}

export function countWords(markdown: string): number {
	const prose = maskMarkdownForProse(markdown);

	return prose.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
}

export function maskMarkdownForProse(markdown: string): string {
	const chars = markdown.split('');
	const lines = lineRanges(markdown);
	let codeFence: { mark: string; length: number } | undefined;

	const maskRange = (from: number, to: number) => {
		for (let index = from; index < to; index += 1) {
			if (chars[index] !== '\n') {
				chars[index] = ' ';
			}
		}
	};

	for (const line of lines) {
		const fence = /^(?: {0,3})(`{3,}|~{3,})/.exec(line.text);

		if (fence) {
			const marker = fence[1];

			if (!marker) {
				continue;
			}

			maskRange(line.from, line.to);

			const mark = marker.charAt(0);

			if (!codeFence) {
				codeFence = { mark, length: marker.length };
			} else if (codeFence.mark === mark && marker.length >= codeFence.length) {
				codeFence = undefined;
			}

			continue;
		}

		if (codeFence) {
			maskRange(line.from, line.to);
			continue;
		}

		const horizontalRule = /^(?: {0,3})([-*_])(?:\s*\1){2,}\s*$/.exec(line.text);

		if (horizontalRule) {
			maskRange(line.from, line.to);
			continue;
		}

		const heading = /^(?: {0,3})#{1,6}\s+/.exec(line.text);

		if (heading) {
			maskRange(line.from, line.from + heading[0].length);
		}

		const blockquote = /^(?: {0,3})>\s?/.exec(line.text);

		if (blockquote) {
			maskRange(line.from, line.from + blockquote[0].length);
		}

		const list = /^(\s*)(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/.exec(line.text);

		if (list) {
			const indent = list[1] ?? '';
			maskRange(line.from + indent.length, line.from + list[0].length);
		}

		const footnoteDef = /^(?: {0,3})\[\^[^\]\n]+\]:\s*/.exec(line.text);

		if (footnoteDef) {
			maskRange(line.from, line.from + footnoteDef[0].length);
		}
	}

	maskPattern(chars, markdown, /`+[^`\n]+`+/g);

	for (const match of markdown.matchAll(/!?\[[^\]\n]*]\([^)\n]*\)/g)) {
		const text = match[0];
		const from = match.index;

		if (text.startsWith('!')) {
			maskRange(from, from + text.length);
			continue;
		}

		const closeLabel = text.indexOf(']');

		maskRange(from, from + 1);
		maskRange(from + closeLabel, from + text.length);
	}

	maskPattern(chars, markdown, /\[\^[^\]\n]+\]/g);
	maskPattern(chars, markdown, /https?:\/\/[^\s)]+/g);
	maskPattern(chars, markdown, /[*_~]/g);

	return chars.join('');
}

export function activeParagraphRange(markdown: string, cursor: number): TextRange {
	if (markdown.length === 0) {
		return { from: 0, to: 0 };
	}

	const position = Math.min(Math.max(cursor, 0), markdown.length);
	const lines = lineRanges(markdown);
	const currentIndex = lines.findIndex((line) => position <= line.to);
	const index = currentIndex === -1 ? lines.length - 1 : currentIndex;
	const currentLine = lines[index];

	if (!currentLine) {
		return { from: 0, to: 0 };
	}

	if (/^\s*$/.test(currentLine.text)) {
		return { from: currentLine.from, to: currentLine.to };
	}

	let first = index;
	let last = index;

	while (first > 0) {
		const previousLine = lines[first - 1];

		if (!previousLine || /^\s*$/.test(previousLine.text)) {
			break;
		}

		first -= 1;
	}

	while (last < lines.length - 1) {
		const nextLine = lines[last + 1];

		if (!nextLine || /^\s*$/.test(nextLine.text)) {
			break;
		}

		last += 1;
	}

	return { from: lines[first]?.from ?? 0, to: lines[last]?.to ?? markdown.length };
}

export function activeSentenceRange(markdown: string, cursor: number): TextRange {
	if (markdown.length === 0) {
		return { from: 0, to: 0 };
	}

	const paragraph = activeParagraphRange(markdown, cursor);
	const prose = maskMarkdownForProse(markdown);
	const position = Math.min(Math.max(cursor, paragraph.from), paragraph.to);
	let lastSentence = paragraph;

	for (const segment of new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(
		prose.slice(paragraph.from, paragraph.to)
	)) {
		const segmentFrom = paragraph.from + segment.index;
		const segmentTo = segmentFrom + segment.segment.length;
		let from = segmentFrom;
		let to = segmentTo;

		while (from < to && /\s/.test(prose.charAt(from))) {
			from += 1;
		}

		while (to > from && /\s/.test(prose.charAt(to - 1))) {
			to -= 1;
		}

		if (from === to) {
			continue;
		}

		lastSentence = { from, to };

		if (position < segmentTo || segmentTo === paragraph.to) {
			return lastSentence;
		}
	}

	return lastSentence;
}

function maskPattern(chars: string[], text: string, pattern: RegExp): void {
	for (const match of text.matchAll(pattern)) {
		for (let i = match.index; i < match.index + match[0].length; i += 1) {
			if (chars[i] !== '\n') {
				chars[i] = ' ';
			}
		}
	}
}

function lineRanges(text: string): Array<TextRange & { text: string }> {
	let from = 0;
	return text.split('\n').map((line) => {
		const range = { from, to: from + line.length, text: line };
		from = range.to + 1;
		return range;
	});
}

export const countCharacters = (markdown: string): number => markdown.length;
export const countCharactersWithoutSpaces = (markdown: string): number =>
	markdown.replace(/\s/g, '').length;

export function countSentences(markdown: string): number {
	const prose = maskMarkdownForProse(markdown);
	const paragraphs = prose.split(/\n\s*\n/);
	let count = 0;
	const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });

	for (const paragraph of paragraphs) {
		const trimmed = paragraph.trim();

		if (!trimmed) {
			continue;
		}

		for (const segment of segmenter.segment(trimmed)) {
			if (/\S/.test(segment.segment)) {
				count += 1;
			}
		}
	}

	return count;
}

export function countParagraphs(markdown: string): number {
	const prose = maskMarkdownForProse(markdown).trim();

	if (prose.length === 0) {
		return 0;
	}

	return prose.split(/\n\s*\n/).filter((block) => block.trim().length > 0).length;
}

export function countTasks(markdown: string): TaskStats {
	const matches = markdown.matchAll(/^(\s*)(?:[-+*]|\d+[.)])\s+\[([ xX])\]/gm);
	let total = 0;
	let completed = 0;

	for (const match of matches) {
		total += 1;
		const mark = match[2]?.toLowerCase();

		if (mark === 'x') {
			completed += 1;
		}
	}

	return {
		total,
		completed,
		pending: total - completed
	};
}

export function estimateReadingTime(markdown: string): {
	readonly minutes: number;
	readonly text: string;
} {
	const prose = maskMarkdownForProse(markdown);
	const estimation = estimate(prose);

	return {
		minutes: estimation.minutes,
		text: estimation.text
	};
}

export function calculateDocumentStats(markdown: string): DocumentStats {
	const words = countWords(markdown);
	const characters = countCharacters(markdown);
	const charactersWithoutSpaces = countCharactersWithoutSpaces(markdown);
	const sentences = countSentences(markdown);
	const paragraphs = countParagraphs(markdown);
	const reading = estimateReadingTime(markdown);
	const tasks = countTasks(markdown);

	return {
		words,
		characters,
		charactersWithoutSpaces,
		sentences,
		paragraphs,
		readingTime: reading.text,
		readingTimeMinutes: reading.minutes,
		tasks
	};
}

export function calculateSelectionStats(selectedText: string): SelectionStats {
	const words = countWords(selectedText);
	const characters = countCharacters(selectedText);
	const charactersWithoutSpaces = countCharactersWithoutSpaces(selectedText);
	const sentences = countSentences(selectedText);

	return {
		words,
		characters,
		charactersWithoutSpaces,
		sentences
	};
}

const markdownParser = new Marked({
	gfm: true,
	breaks: true
}).use(markedFootnote());

export function renderMarkdown(markdown: string): string {
	if (!markdown || !markdown.trim()) {
		return '';
	}

	return markdownParser.parse(markdown) as string;
}
