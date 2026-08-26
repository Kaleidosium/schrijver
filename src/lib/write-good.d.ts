declare module 'write-good' {
	export interface WriteGoodSuggestion {
		index: number;
		offset: number;
		reason: string;
	}

	export default function writeGood(
		text: string,
		options?: Record<string, unknown>
	): WriteGoodSuggestion[];
}
