import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';

export interface TextSelector {
	readonly from: number;
	readonly to: number;
	readonly quote: string;
	readonly prefix?: string;
	readonly suffix?: string;
}

export interface WriterNote {
	readonly id: string;
	readonly createdAt: string;
	updatedAt: string;
	body: string;
	resolved: boolean;
	selection?: TextSelector;
}

export interface WriterSidecar {
	readonly version: 1;
	readonly projectId: string;
	readonly markdownFile: string;
	readonly notes: WriterNote[];
}

export interface RecoveryContext {
	readonly anchor: number;
	readonly head: number;
	readonly scrollTop: number;
	readonly activeNoteId?: string;
	readonly outlineOpen: boolean;
	readonly notesOpen: boolean;
}

export interface RecoveryJournal {
	readonly version: 1;
	readonly markdown: string;
	readonly fileName: string;
	readonly baselineHash?: string;
	readonly sidecar: WriterSidecar;
	readonly context: RecoveryContext;
	readonly updatedAt: string;
	readonly revision: number;
}

export interface OutlineItem {
	readonly id: string;
	readonly level: number;
	readonly from: number;
	readonly label: string;
}

export function emptySidecar(markdownFile: string): WriterSidecar {
	return {
		version: 1,
		projectId: crypto.randomUUID(),
		markdownFile,
		notes: []
	};
}

export function sidecarName(markdownFile: string): string {
	return `${markdownFile.replace(/\.(?:md|markdown|txt)$/i, '')}.schrijver.json`;
}

export function normalizeMarkdownFileName(name: string): string {
	const trimmed = name.trim();

	if (!trimmed || /[/\\]/.test(trimmed)) {
		throw new Error('Choose a valid file name.');
	}

	return /\.(?:md|markdown|txt)$/i.test(trimmed) ? trimmed : `${trimmed}.md`;
}

export function fallbackFileNames(
	name: string,
	date: Date
): { readonly markdown: string; readonly sidecar: string } {
	const normalized = normalizeMarkdownFileName(name);
	const extension = normalized.match(/\.(?:md|markdown|txt)$/i)?.[0] ?? '.md';
	const timestamp = date.toISOString().replace('T', '-').replace(/[:.]/g, '-');
	const markdown = `${normalized.slice(0, -extension.length)}-${timestamp}${extension}`;

	return { markdown, sidecar: sidecarName(markdown) };
}

export function hashText(text: string): string {
	let hash = 2166136261;

	for (let index = 0; index < text.length; index += 1) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(16).padStart(8, '0');
}

export function outlineItems(state: EditorState): OutlineItem[] {
	const items: OutlineItem[] = [];
	const tree = ensureSyntaxTree(state, state.doc.length) ?? syntaxTree(state);
	const cursor = tree.cursor();

	do {
		const match = /^(?:ATX|Setext)Heading([1-6])$/.exec(cursor.name);

		if (!match) {
			continue;
		}

		const level = Number(match[1]);
		const source = state.doc.sliceString(cursor.from, cursor.to);
		const label = source
			.replace(/^ {0,3}#{1,6}\s+/, '')
			.replace(/\s+#+\s*$/, '')
			.replace(/\n(?:=+|-+)\s*$/, '')
			.replace(/[*_~`[\]]/g, '')
			.trim();

		items.push({
			id: `${cursor.from}:${level}`,
			level,
			from: cursor.from,
			label: label || 'Untitled heading'
		});
	} while (cursor.next());

	return items;
}

export function resolveTextSelector(
	selector: TextSelector,
	document: string,
	searchRadius = 250
): { readonly from: number; readonly to: number } | undefined {
	if (
		selector.from >= 0 &&
		selector.to > selector.from &&
		selector.to <= document.length &&
		document.slice(selector.from, selector.to) === selector.quote
	) {
		return { from: selector.from, to: selector.to };
	}

	if (!selector.quote || selector.from < 0 || selector.to <= selector.from) {
		return undefined;
	}

	const quoteLen = selector.quote.length;
	const searchStart = Math.max(0, selector.from - searchRadius);
	const searchEnd = Math.min(document.length, selector.to + searchRadius);

	if (searchStart >= searchEnd) {
		return undefined;
	}

	const windowText = document.slice(searchStart, searchEnd);
	let bestPos: number | undefined;
	let bestScore = -1;
	let index = windowText.indexOf(selector.quote);

	while (index !== -1) {
		const absolutePos = searchStart + index;
		let score = 100 - (Math.abs(absolutePos - selector.from) / searchRadius) * 50;

		if (selector.prefix) {
			const actualPrefix = document.slice(
				Math.max(0, absolutePos - selector.prefix.length),
				absolutePos
			);
			if (actualPrefix === selector.prefix) {
				score += 50;
			} else if (actualPrefix.endsWith(selector.prefix.slice(-10))) {
				score += 25;
			}
		}

		if (selector.suffix) {
			const actualSuffix = document.slice(
				absolutePos + quoteLen,
				absolutePos + quoteLen + selector.suffix.length
			);
			if (actualSuffix === selector.suffix) {
				score += 50;
			} else if (actualSuffix.startsWith(selector.suffix.slice(0, 10))) {
				score += 25;
			}
		}

		if (score > bestScore) {
			bestScore = score;
			bestPos = absolutePos;
		}

		index = windowText.indexOf(selector.quote, index + 1);
	}

	return bestPos !== undefined ? { from: bestPos, to: bestPos + quoteLen } : undefined;
}

export function parseSidecar(value: unknown, markdownFile: string): WriterSidecar {
	const raw = value as Partial<WriterSidecar> | null | undefined;
	if (
		typeof raw !== 'object' ||
		raw === null ||
		raw.version !== 1 ||
		typeof raw.projectId !== 'string'
	) {
		throw new Error('The notes file has an unsupported format.');
	}

	if (typeof raw.markdownFile !== 'string' || !Array.isArray(raw.notes)) {
		throw new Error('The notes file is incomplete.');
	}

	return {
		version: 1,
		projectId: raw.projectId,
		markdownFile,
		notes: raw.notes.map(parseNote)
	};
}

export function parseRecovery(value: string | null): RecoveryJournal | undefined {
	if (!value) {
		return undefined;
	}

	try {
		const parsed = JSON.parse(value) as Partial<RecoveryJournal>;
		const context = parsed?.context;

		if (
			parsed?.version !== 1 ||
			typeof parsed.markdown !== 'string' ||
			typeof parsed.fileName !== 'string' ||
			typeof parsed.updatedAt !== 'string' ||
			typeof parsed.revision !== 'number' ||
			typeof context?.anchor !== 'number' ||
			typeof context?.head !== 'number' ||
			typeof context?.scrollTop !== 'number' ||
			typeof context?.outlineOpen !== 'boolean' ||
			typeof context?.notesOpen !== 'boolean'
		) {
			return undefined;
		}

		return {
			version: 1,
			markdown: parsed.markdown,
			fileName: parsed.fileName,
			...(typeof parsed.baselineHash === 'string' ? { baselineHash: parsed.baselineHash } : {}),
			sidecar: parseSidecar(parsed.sidecar, parsed.fileName),
			context: {
				anchor: context.anchor,
				head: context.head,
				scrollTop: context.scrollTop,
				...(typeof context.activeNoteId === 'string' ? { activeNoteId: context.activeNoteId } : {}),
				outlineOpen: context.outlineOpen,
				notesOpen: context.notesOpen
			},
			updatedAt: parsed.updatedAt,
			revision: parsed.revision
		};
	} catch {
		return undefined;
	}
}

function parseNote(value: unknown): WriterNote {
	const note = value as Partial<WriterNote> | null | undefined;
	if (
		typeof note !== 'object' ||
		note === null ||
		typeof note.id !== 'string' ||
		typeof note.body !== 'string' ||
		typeof note.createdAt !== 'string' ||
		typeof note.updatedAt !== 'string' ||
		typeof note.resolved !== 'boolean'
	) {
		throw new Error('A note is incomplete.');
	}

	return {
		id: note.id,
		body: note.body,
		createdAt: note.createdAt,
		updatedAt: note.updatedAt,
		resolved: note.resolved,
		...(note.selection !== undefined && note.selection !== null
			? { selection: parseTextSelector(note.selection) }
			: {})
	};
}

function parseTextSelector(value: unknown): TextSelector {
	const sel = value as Partial<TextSelector> | null | undefined;
	if (
		typeof sel !== 'object' ||
		sel === null ||
		typeof sel.from !== 'number' ||
		typeof sel.to !== 'number' ||
		typeof sel.quote !== 'string' ||
		sel.from < 0 ||
		sel.to < sel.from ||
		(sel.to > sel.from && sel.quote.length !== sel.to - sel.from)
	) {
		throw new Error('A note text selection is invalid.');
	}

	return {
		from: sel.from,
		to: sel.to,
		quote: sel.quote,
		...(typeof sel.prefix === 'string' ? { prefix: sel.prefix } : {}),
		...(typeof sel.suffix === 'string' ? { suffix: sel.suffix } : {})
	};
}
