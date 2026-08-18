import {
	closeSearchPanel,
	findNext,
	findPrevious,
	getSearchQuery,
	replaceNext,
	replaceAll,
	SearchQuery,
	selectMatches,
	setSearchQuery
} from '@codemirror/search';
import type { EditorState } from '@codemirror/state';
import type { EditorView, Panel, ViewUpdate } from '@codemirror/view';

export interface MatchStats {
	readonly current: number;
	readonly total: number;
}

export function calculateMatchStats(state: EditorState, query: SearchQuery): MatchStats {
	if (!query.valid || !query.search) {
		return { current: 0, total: 0 };
	}

	try {
		const cursor = query.getCursor(state);
		let total = 0;
		let current = 0;
		const mainSel = state.selection.main;
		const MAX_MATCHES_TO_COUNT = 1000;

		let iter = cursor.next();
		while (!iter.done) {
			total += 1;
			const match = iter.value;

			if (match.from === mainSel.from && match.to === mainSel.to) {
				current = total;
			} else if (
				current === 0 &&
				mainSel.from >= match.from &&
				mainSel.to <= match.to &&
				!mainSel.empty
			) {
				current = total;
			}

			if (total >= MAX_MATCHES_TO_COUNT) {
				break;
			}
			iter = cursor.next();
		}

		return { current, total };
	} catch {
		return { current: 0, total: 0 };
	}
}

function elt<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	props: Record<string, string | boolean | undefined> | null,
	children?: readonly (Node | string)[]
): HTMLElementTagNameMap[K] {
	const element = document.createElement(tag);
	if (props) {
		for (const [key, value] of Object.entries(props)) {
			if (value === undefined) {
				continue;
			}
			if (typeof value === 'boolean') {
				if (value) {
					element.setAttribute(key, '');
				}
			} else {
				element.setAttribute(key, value);
			}
		}
	}
	if (children) {
		for (const child of children) {
			if (typeof child === 'string') {
				element.appendChild(document.createTextNode(child));
			} else {
				element.appendChild(child);
			}
		}
	}
	return element;
}

function createSvgElement(viewBox: string, pathData: string, size = 14): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', String(size));
	svg.setAttribute('height', String(size));
	svg.setAttribute('viewBox', viewBox);
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');
	svg.setAttribute('aria-hidden', 'true');

	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', pathData);
	svg.appendChild(path);

	return svg;
}

export class ZedSearchPanel implements Panel {
	readonly dom: HTMLElement;
	private readonly view: EditorView;
	private query: SearchQuery;
	private readonly searchField: HTMLInputElement;
	private readonly replaceField: HTMLInputElement;
	private readonly caseBtn: HTMLButtonElement;
	private readonly wordBtn: HTMLButtonElement;
	private readonly reBtn: HTMLButtonElement;
	private readonly countBadge: HTMLSpanElement;

	private caseActive: boolean;
	private wordActive: boolean;
	private reActive: boolean;

	constructor(view: EditorView) {
		this.view = view;
		const query = (this.query = getSearchQuery(view.state));
		this.caseActive = query.caseSensitive;
		this.wordActive = query.wholeWord;
		this.reActive = query.regexp;

		this.commit = this.commit.bind(this);
		this.keydown = this.keydown.bind(this);

		// Search Input
		this.searchField = elt('input', {
			class: 'cm-textfield cm-search-input-field',
			name: 'search',
			placeholder: 'Search...',
			'aria-label': 'Search',
			value: query.search,
			'main-field': 'true',
			autocomplete: 'off',
			autocorrect: 'off',
			autocapitalize: 'off',
			spellcheck: 'false'
		});
		this.searchField.addEventListener('input', () => {
			this.commit();
		});

		// Toggles inside Search input box
		this.caseBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-search-toggle-btn',
				name: 'case',
				title: 'Match Case (⌥⌘C)',
				'aria-label': 'Match Case',
				'aria-pressed': this.caseActive ? 'true' : 'false'
			},
			['Aa']
		);
		this.caseBtn.addEventListener('click', () => {
			this.caseActive = !this.caseActive;
			this.updateToggleStates();
			this.commit();
		});

		const wordSpan = elt('span', { class: 'cm-search-word-label' }, ['wd']);
		this.wordBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-search-toggle-btn cm-search-toggle-word',
				name: 'word',
				title: 'Match Whole Word (⌥⌘W)',
				'aria-label': 'Match Whole Word',
				'aria-pressed': this.wordActive ? 'true' : 'false'
			},
			[wordSpan]
		);
		this.wordBtn.addEventListener('click', () => {
			this.wordActive = !this.wordActive;
			this.updateToggleStates();
			this.commit();
		});

		this.reBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-search-toggle-btn',
				name: 're',
				title: 'Use Regular Expression (⌥⌘R)',
				'aria-label': 'Use Regular Expression',
				'aria-pressed': this.reActive ? 'true' : 'false'
			},
			['.*']
		);
		this.reBtn.addEventListener('click', () => {
			this.reActive = !this.reActive;
			this.updateToggleStates();
			this.commit();
		});

		const searchToggles = elt(
			'div',
			{ class: 'cm-search-input-toggles', role: 'group', 'aria-label': 'Search options' },
			[this.caseBtn, this.wordBtn, this.reBtn]
		);

		const searchInputBox = elt('div', { class: 'cm-search-input-box' }, [
			this.searchField,
			searchToggles
		]);

		// Search Actions
		const selectAllSvg = createSvgElement('0 0 24 24', 'M3 6h18M3 12h18M3 18h18');
		const selectAllBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-button cm-search-action-btn',
				name: 'select',
				title: 'Select All Matches (⌥Enter)',
				'aria-label': 'Select All Matches'
			},
			[selectAllSvg]
		);
		selectAllBtn.addEventListener('click', () => selectMatches(this.view));

		const spacer = elt('div', { class: 'cm-search-spacer', 'aria-hidden': 'true' });
		const separator = elt('div', { class: 'cm-search-v-sep', 'aria-hidden': 'true' });

		const prevSvg = createSvgElement('0 0 24 24', 'm15 18-6-6 6-6');
		const prevBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-button cm-search-action-btn',
				name: 'prev',
				title: 'Previous Match (⇧Enter)',
				'aria-label': 'Previous Match'
			},
			[prevSvg]
		);
		prevBtn.addEventListener('click', () => findPrevious(this.view));

		const nextSvg = createSvgElement('0 0 24 24', 'm9 18 6-6-6-6');
		const nextBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-button cm-search-action-btn',
				name: 'next',
				title: 'Next Match (Enter)',
				'aria-label': 'Next Match'
			},
			[nextSvg]
		);
		nextBtn.addEventListener('click', () => findNext(this.view));

		this.countBadge = elt(
			'span',
			{
				class: 'cm-search-count-badge',
				'aria-live': 'polite',
				'aria-label': 'Match count'
			},
			['0/0']
		);

		const searchActions = elt('div', { class: 'cm-search-actions' }, [
			selectAllBtn,
			spacer,
			separator,
			prevBtn,
			nextBtn,
			this.countBadge
		]);

		const searchRow = elt('div', { class: 'cm-search-row' }, [searchInputBox, searchActions]);

		// Replace row
		this.replaceField = elt('input', {
			class: 'cm-textfield cm-search-input-field',
			name: 'replace',
			placeholder: 'Replace with...',
			'aria-label': 'Replace with',
			value: query.replace,
			autocomplete: 'off',
			autocorrect: 'off',
			autocapitalize: 'off',
			spellcheck: 'false'
		});
		this.replaceField.addEventListener('input', () => {
			this.commit();
		});

		const replaceInputBox = elt('div', { class: 'cm-search-input-box cm-replace-input-box' }, [
			this.replaceField
		]);

		// Replace Next SVG: Curved arrow down-right (CornerDownRight)
		const replaceNextSvg = createSvgElement('0 0 24 24', 'm15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12');
		const replaceNextBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-button cm-search-action-btn',
				name: 'replace',
				title: 'Replace Next (Enter in replace field)',
				'aria-label': 'Replace Next'
			},
			[replaceNextSvg]
		);
		replaceNextBtn.addEventListener('click', () => replaceNext(this.view));

		// Replace All SVG
		const replaceAllSvg = createSvgElement(
			'0 0 24 24',
			'M14 4c0-1.1.9-2 2-2M20 2a2 2 0 0 1 2 2M22 8a2 2 0 0 1-2 2M16 10a2 2 0 0 1-2-2M3 7l3 3 3-3M6 10V5a3 3 0 0 1 3-3h2M3 17l3 3 3-3M6 20v-5a3 3 0 0 1 3-3h2'
		);
		const replaceAllBtn = elt(
			'button',
			{
				type: 'button',
				class: 'cm-button cm-search-action-btn',
				name: 'replaceAll',
				title: 'Replace All (⌥Enter in replace field)',
				'aria-label': 'Replace All'
			},
			[replaceAllSvg]
		);
		replaceAllBtn.addEventListener('click', () => replaceAll(this.view));

		const replaceActions = elt('div', { class: 'cm-replace-actions' }, [
			replaceNextBtn,
			replaceAllBtn
		]);

		const replaceRow = elt('div', { class: 'cm-replace-row' }, [replaceInputBox, replaceActions]);

		const rows: HTMLElement[] = [searchRow];
		if (!view.state.readOnly) {
			rows.push(replaceRow);
		}

		this.dom = elt(
			'div',
			{
				class: 'cm-panel cm-search cm-zed-search',
				role: 'search'
			},
			rows
		);

		this.dom.addEventListener('keydown', (e) => {
			this.keydown(e);
		});
		this.updateToggleStates();
		this.updateMatchCount();
	}

	private updateToggleStates(): void {
		this.caseBtn.setAttribute('aria-pressed', this.caseActive ? 'true' : 'false');
		this.wordBtn.setAttribute('aria-pressed', this.wordActive ? 'true' : 'false');
		this.reBtn.setAttribute('aria-pressed', this.reActive ? 'true' : 'false');
	}

	private updateMatchCount(): void {
		const stats = calculateMatchStats(this.view.state, this.query);
		const totalStr = stats.total >= 1000 ? '999+' : String(stats.total);
		this.countBadge.textContent = `${stats.current}/${totalStr}`;
	}

	private commit(): void {
		const query = new SearchQuery({
			search: this.searchField.value,
			caseSensitive: this.caseActive,
			wholeWord: this.wordActive,
			regexp: this.reActive,
			replace: this.replaceField.value
		});

		if (!query.eq(this.query)) {
			this.query = query;
			this.view.dispatch({ effects: setSearchQuery.of(query) });
		}
		this.updateMatchCount();
	}

	private keydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeSearchPanel(this.view);
			return;
		}

		const isMod = e.metaKey || e.ctrlKey;

		// Shortcuts to toggle search options
		if (isMod && e.altKey) {
			const key = e.key.toLowerCase();
			if (key === 'c') {
				e.preventDefault();
				this.caseActive = !this.caseActive;
				this.updateToggleStates();
				this.commit();
				return;
			}
			if (key === 'w') {
				e.preventDefault();
				this.wordActive = !this.wordActive;
				this.updateToggleStates();
				this.commit();
				return;
			}
			if (key === 'r') {
				e.preventDefault();
				this.reActive = !this.reActive;
				this.updateToggleStates();
				this.commit();
				return;
			}
		}

		if (e.key === 'Enter') {
			if (e.target === this.searchField) {
				e.preventDefault();
				if (e.altKey) {
					selectMatches(this.view);
				} else if (e.shiftKey) {
					findPrevious(this.view);
				} else {
					findNext(this.view);
				}
			} else if (e.target === this.replaceField) {
				e.preventDefault();
				if (e.altKey) {
					replaceAll(this.view);
				} else {
					replaceNext(this.view);
				}
			}
		}
	}

	public update(update: ViewUpdate): void {
		for (const tr of update.transactions) {
			for (const effect of tr.effects) {
				if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) {
					this.setQuery(effect.value);
				}
			}
		}

		if (update.docChanged || update.selectionSet || update.viewportChanged) {
			this.updateMatchCount();
		}
	}

	private setQuery(query: SearchQuery): void {
		this.query = query;
		if (this.searchField.value !== query.search) {
			this.searchField.value = query.search;
		}
		if (this.replaceField.value !== query.replace) {
			this.replaceField.value = query.replace;
		}
		this.caseActive = query.caseSensitive;
		this.wordActive = query.wholeWord;
		this.reActive = query.regexp;
		this.updateToggleStates();
		this.updateMatchCount();
	}

	public mount(): void {
		this.searchField.focus();
		this.searchField.select();
		this.updateMatchCount();
	}

	public get pos(): number {
		return 80;
	}

	public get top(): boolean {
		return true;
	}
}

export function createZedSearchPanel(view: EditorView): Panel {
	return new ZedSearchPanel(view);
}
