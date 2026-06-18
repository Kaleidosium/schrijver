export interface TextRange {
	from: number;
	to: number;
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

function maskPattern(chars: string[], text: string, pattern: RegExp) {
	for (const match of text.matchAll(pattern)) {
		const from = match.index;

		for (let index = from; index < from + match[0].length; index += 1) {
			if (chars[index] !== '\n') {
				chars[index] = ' ';
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
