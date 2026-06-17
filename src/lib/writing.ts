export interface TextRange {
	from: number;
	to: number;
}

export function countWords(markdown: string): number {
	const prose = markdown
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
		.replace(/\[([^\]]+)]\([^)]+\)/g, '$1');

	return prose.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length ?? 0;
}

export function activeParagraphRange(markdown: string, cursor: number): TextRange {
	if (markdown.length === 0) {
		return { from: 0, to: 0 };
	}

	const position = Math.min(Math.max(cursor, 0), markdown.length);
	const lines = lineRanges(markdown);
	const currentIndex = lines.findIndex((line) => position <= line.to);
	const index = currentIndex === -1 ? lines.length - 1 : currentIndex;

	if (/^\s*$/.test(lines[index].text)) {
		return { from: lines[index].from, to: lines[index].to };
	}

	let first = index;
	let last = index;

	while (first > 0 && !/^\s*$/.test(lines[first - 1].text)) {
		first -= 1;
	}

	while (last < lines.length - 1 && !/^\s*$/.test(lines[last + 1].text)) {
		last += 1;
	}

	return { from: lines[first].from, to: lines[last].to };
}

function lineRanges(text: string): Array<TextRange & { text: string }> {
	let from = 0;

	return text.split('\n').map((line) => {
		const range = { from, to: from + line.length, text: line };
		from = range.to + 1;
		return range;
	});
}
