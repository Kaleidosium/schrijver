import {
	CaseSensitive,
	ChevronLeft,
	ChevronRight,
	Regex,
	Replace,
	ReplaceAll,
	SquareDashedText,
	WholeWord,
	X,
	type LucideIcon
} from '@lucide/svelte';
import { mount, unmount } from 'svelte';

interface SearchIconSpec {
	readonly component: LucideIcon;
	readonly label: string;
	readonly selector: string;
}

const searchIconSpecs: readonly SearchIconSpec[] = [
	{
		selector: 'label:has(input[name="case"])',
		component: CaseSensitive,
		label: 'Match case'
	},
	{
		selector: 'label:has(input[name="word"])',
		component: WholeWord,
		label: 'Match whole word'
	},
	{
		selector: 'label:has(input[name="re"])',
		component: Regex,
		label: 'Use regular expression'
	},
	{
		selector: 'button[name="select"]',
		component: SquareDashedText,
		label: 'Select all matches'
	},
	{
		selector: 'button[name="prev"]',
		component: ChevronLeft,
		label: 'Previous match'
	},
	{
		selector: 'button[name="next"]',
		component: ChevronRight,
		label: 'Next match'
	},
	{
		selector: 'button[name="close"]',
		component: X,
		label: 'Close search'
	},
	{
		selector: 'button[name="replace"]',
		component: Replace,
		label: 'Replace next match'
	},
	{
		selector: 'button[name="replaceAll"]',
		component: ReplaceAll,
		label: 'Replace all matches'
	}
];

export function installSearchIcons(root: HTMLElement): () => void {
	const mountedIcons = new Map<Element, Record<string, unknown>>();
	const decorate = (): void => {
		for (const [target, icon] of mountedIcons) {
			if (!target.isConnected) {
				void unmount(icon);
				mountedIcons.delete(target);
			}
		}

		const panel = root.querySelector<HTMLElement>('.cm-panel.cm-search');

		if (!panel) {
			return;
		}

		for (const { component, label, selector } of searchIconSpecs) {
			const target = panel.querySelector<HTMLElement>(selector);

			if (!target || mountedIcons.has(target)) {
				continue;
			}

			target.classList.add('cm-search-icon');
			target.title = label;

			if (target instanceof HTMLButtonElement) {
				target.setAttribute('aria-label', label);
			} else {
				target.querySelector('input')?.setAttribute('aria-label', label);
			}

			mountedIcons.set(
				target,
				mount(component, {
					target,
					props: { size: 15, strokeWidth: 1.75 }
				})
			);
		}
	};
	const observer = new MutationObserver(decorate);

	observer.observe(root, { childList: true, subtree: true });
	decorate();

	return () => {
		observer.disconnect();

		for (const icon of mountedIcons.values()) {
			void unmount(icon);
		}
	};
}
