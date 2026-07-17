import type { WriterNote } from '$lib/writer-document';

export type FocusScope = 'all' | 'paragraph' | 'sentence';
export type PartOfSpeech = 'Adjective' | 'Noun' | 'Adverb' | 'Verb' | 'Conjunction';
export type ReviewCheck =
	| 'weasel'
	| 'illusion'
	| 'so'
	| 'thereIs'
	| 'passive'
	| 'adverb'
	| 'tooWordy'
	| 'cliches'
	| 'eprime';

export interface NoteView {
	readonly note: WriterNote;
	readonly anchorLabel: string;
	readonly orphaned: boolean;
	readonly top: number;
}
