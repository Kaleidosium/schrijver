import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';

export interface TextSelector {
	readonly from: number;
	readonly to: number;
	readonly quote: string;
}

export interface WriterNote {
	readonly id: string;
	readonly createdAt: string;
	updatedAt: string;
	body: string;
	resolved: boolean;
	selection: TextSelector;
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

export interface FallbackFileNames {
	readonly markdown: string;
	readonly sidecar: string;
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

export function fallbackFileNames(name: string, date: Date): FallbackFileNames {
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
	const cursor = syntaxTree(state).cursor();

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
	document: string
): { readonly from: number; readonly to: number } | undefined {
	if (
		selector.from >= 0 &&
		selector.to > selector.from &&
		selector.to <= document.length &&
		document.slice(selector.from, selector.to) === selector.quote
	) {
		return { from: selector.from, to: selector.to };
	}

	if (!selector.quote) {
		return undefined;
	}

	let nearest: number | undefined;
	let position = document.indexOf(selector.quote);

	while (position !== -1) {
		if (
			nearest === undefined ||
			Math.abs(position - selector.from) < Math.abs(nearest - selector.from)
		) {
			nearest = position;
		}

		position = document.indexOf(selector.quote, position + 1);
	}

	return nearest === undefined ? undefined : { from: nearest, to: nearest + selector.quote.length };
}

export function parseSidecar(value: unknown, markdownFile: string): WriterSidecar {
	if (!isRecord(value) || value.version !== 1 || typeof value.projectId !== 'string') {
		throw new Error('The Writer’s Notes file has an unsupported format.');
	}

	if (typeof value.markdownFile !== 'string' || !Array.isArray(value.notes)) {
		throw new Error('The Writer’s Notes file is incomplete.');
	}

	return {
		version: 1,
		projectId: value.projectId,
		markdownFile,
		notes: value.notes.map(parseNote)
	};
}

export function parseRecovery(value: string | null): RecoveryJournal | undefined {
	if (!value) {
		return undefined;
	}

	try {
		const parsed: unknown = JSON.parse(value);

		if (
			!isRecord(parsed) ||
			parsed.version !== 1 ||
			typeof parsed.markdown !== 'string' ||
			typeof parsed.fileName !== 'string' ||
			typeof parsed.updatedAt !== 'string' ||
			typeof parsed.revision !== 'number' ||
			!isRecord(parsed.context)
		) {
			return undefined;
		}

		const context = parsed.context;

		if (
			typeof context.anchor !== 'number' ||
			typeof context.head !== 'number' ||
			typeof context.scrollTop !== 'number' ||
			typeof context.outlineOpen !== 'boolean' ||
			typeof context.notesOpen !== 'boolean'
		) {
			return undefined;
		}

		const sidecar = parseSidecar(parsed.sidecar, parsed.fileName);

		return {
			version: 1,
			markdown: parsed.markdown,
			fileName: parsed.fileName,
			...(typeof parsed.baselineHash === 'string' ? { baselineHash: parsed.baselineHash } : {}),
			sidecar,
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
	if (
		!isRecord(value) ||
		typeof value.id !== 'string' ||
		typeof value.body !== 'string' ||
		typeof value.createdAt !== 'string' ||
		typeof value.updatedAt !== 'string' ||
		typeof value.resolved !== 'boolean'
	) {
		throw new Error('A Writer’s Note is incomplete.');
	}

	return {
		id: value.id,
		body: value.body,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		resolved: value.resolved,
		selection: parseTextSelector(value.selection)
	};
}

function parseTextSelector(value: unknown): TextSelector {
	if (
		!isRecord(value) ||
		typeof value.from !== 'number' ||
		typeof value.to !== 'number' ||
		typeof value.quote !== 'string' ||
		value.from < 0 ||
		value.to <= value.from ||
		value.quote.length !== value.to - value.from
	) {
		throw new Error('A Writer’s Note text selection is invalid.');
	}

	return { from: value.from, to: value.to, quote: value.quote };
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
