import {
	closeSearchPanel,
	findNext,
	findPrevious,
	getSearchQuery,
	openSearchPanel,
	replaceNext,
	replaceAll,
	SearchQuery,
	selectMatches,
	setSearchQuery
} from '@codemirror/search';
import type { EditorState } from '@codemirror/state';
import type { EditorView, Panel, ViewUpdate } from '@codemirror/view';
import { formatForDisplay } from '@tanstack/svelte-hotkeys';

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

function getSearchPanelHtml(): string {
	return `
<div class="cm-search-row">
	<div class="cm-search-input-box">
		<input class="cm-textfield cm-search-input-field" name="search" placeholder="Find…" aria-label="Find" main-field="true" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
		<div class="cm-search-input-toggles" role="group" aria-label="Search options">
			<button type="button" class="cm-search-toggle-btn" name="case" title="Match case (${formatForDisplay('Mod+Alt+C')})" aria-label="Match case" aria-pressed="false">Aa</button>
			<button type="button" class="cm-search-toggle-btn cm-search-toggle-word" name="word" title="Match whole word (${formatForDisplay('Mod+Alt+W')})" aria-label="Match whole word" aria-pressed="false"><span class="cm-search-word-label">wd</span></button>
			<button type="button" class="cm-search-toggle-btn" name="re" title="Use regular expression (${formatForDisplay('Mod+Alt+R')})" aria-label="Use regular expression" aria-pressed="false">.*</button>
		</div>
	</div>
	<div class="cm-search-actions">
		<button type="button" class="cm-button cm-search-action-btn" name="select" title="Select all matches (${formatForDisplay('Alt+Enter')})" aria-label="Select all matches">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
		</button>
		<div class="cm-search-spacer" aria-hidden="true"></div>
		<div class="cm-search-v-sep" aria-hidden="true"></div>
		<button type="button" class="cm-button cm-search-action-btn" name="prev" title="Previous match (${formatForDisplay('Shift+Enter')})" aria-label="Previous match">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
		</button>
		<button type="button" class="cm-button cm-search-action-btn" name="next" title="Next match (Enter)" aria-label="Next match">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
		</button>
		<span class="cm-search-count-badge" aria-live="polite" aria-label="Match count">0/0</span>
	</div>
</div>
<div class="cm-replace-row">
	<div class="cm-search-input-box cm-replace-input-box">
		<input class="cm-textfield cm-search-input-field" name="replace" placeholder="Replace…" aria-label="Replace" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
	</div>
	<div class="cm-replace-actions">
		<button type="button" class="cm-button cm-search-action-btn" name="replace" title="Replace next (Enter in replace field)" aria-label="Replace next">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 10 5 5-5 5M4 4v7a4 4 0 0 0 4 4h12"/></svg>
		</button>
		<button type="button" class="cm-button cm-search-action-btn" name="replaceAll" title="Replace all (${formatForDisplay('Alt+Enter')} in replace field)" aria-label="Replace all">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4c0-1.1.9-2 2-2M20 2a2 2 0 0 1 2 2M22 8a2 2 0 0 1-2 2M16 10a2 2 0 0 1-2-2M3 7l3 3 3-3M6 10V5a3 3 0 0 1 3-3h2M3 17l3 3 3-3M6 20v-5a3 3 0 0 1 3-3h2"/></svg>
		</button>
	</div>
</div>
`;
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

		this.dom = document.createElement('div');
		this.dom.className = 'cm-panel cm-search cm-zed-search';
		this.dom.setAttribute('role', 'search');
		this.dom.innerHTML = getSearchPanelHtml();

		if (view.state.readOnly) {
			this.dom.querySelector('.cm-replace-row')?.remove();
		}

		this.searchField = this.dom.querySelector('input[name="search"]')!;
		this.replaceField = this.dom.querySelector('input[name="replace"]')!;
		this.caseBtn = this.dom.querySelector('button[name="case"]')!;
		this.wordBtn = this.dom.querySelector('button[name="word"]')!;
		this.reBtn = this.dom.querySelector('button[name="re"]')!;
		this.countBadge = this.dom.querySelector('.cm-search-count-badge')!;

		this.searchField.value = query.search;
		if (this.replaceField) {
			this.replaceField.value = query.replace;
		}

		this.searchField.addEventListener('input', () => this.commit());
		this.replaceField?.addEventListener('input', () => this.commit());

		this.caseBtn.addEventListener('click', () => {
			this.caseActive = !this.caseActive;
			this.updateToggleStates();
			this.commit();
		});

		this.wordBtn.addEventListener('click', () => {
			this.wordActive = !this.wordActive;
			this.updateToggleStates();
			this.commit();
		});

		this.reBtn.addEventListener('click', () => {
			this.reActive = !this.reActive;
			this.updateToggleStates();
			this.commit();
		});

		this.dom
			.querySelector('button[name="select"]')
			?.addEventListener('click', () => selectMatches(this.view));
		this.dom
			.querySelector('button[name="prev"]')
			?.addEventListener('click', () => findPrevious(this.view));
		this.dom
			.querySelector('button[name="next"]')
			?.addEventListener('click', () => findNext(this.view));
		this.dom
			.querySelector('button[name="replace"]')
			?.addEventListener('click', () => replaceNext(this.view));
		this.dom
			.querySelector('button[name="replaceAll"]')
			?.addEventListener('click', () => replaceAll(this.view));

		this.dom.addEventListener('keydown', (e) => this.keydown(e));
		this.updateToggleStates();
		this.updateMatchCount();
	}

	private updateToggleStates(): void {
		this.caseBtn.setAttribute('aria-pressed', String(this.caseActive));
		this.wordBtn.setAttribute('aria-pressed', String(this.wordActive));
		this.reBtn.setAttribute('aria-pressed', String(this.reActive));
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
			replace: this.replaceField?.value ?? ''
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

		if (isMod && e.altKey) {
			const key = e.key.toLowerCase();
			if (key === 'c' || key === 'w' || key === 'r') {
				e.preventDefault();
				if (key === 'c') {
					this.caseActive = !this.caseActive;
				} else if (key === 'w') {
					this.wordActive = !this.wordActive;
				} else {
					this.reActive = !this.reActive;
				}
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
		if (this.replaceField && this.replaceField.value !== query.replace) {
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

export function openReplacePanel(view: EditorView): boolean {
	openSearchPanel(view);
	requestAnimationFrame(() => {
		const replaceField = view.dom.querySelector(
			'.cm-zed-search input[name="replace"]'
		) as HTMLInputElement | null;
		if (replaceField) {
			replaceField.focus();
			replaceField.select();
		}
	});
	return true;
}
