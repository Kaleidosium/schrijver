<script lang="ts">
	import { DropdownMenu, Popover, Tooltip } from 'bits-ui';
	import {
		Asterisk,
		Bold,
		ChevronDown,
		Clock,
		Code,
		Heading,
		Italic,
		Link as LinkIcon,
		List,
		ListOrdered,
		ListTodo,
		Minus,
		Quote,
		SquarePen,
		Strikethrough
	} from '@lucide/svelte';
	import type { DocumentStats, SelectionStats } from '$lib/writing';

	interface Props {
		readonly addNoteDisabled?: boolean | undefined;
		readonly documentStats: DocumentStats;
		readonly selectionStats?: SelectionStats | undefined;
		readonly onAddNote?: (() => void) | undefined;
		readonly onToggleFormat: (open: string, close?: string | undefined) => void;
		readonly onToggleHeading: (level: number) => void;
		readonly onToggleBlockquote: () => void;
		readonly onToggleBulletList: () => void;
		readonly onToggleNumberedList: () => void;
		readonly onToggleTaskList: () => void;
		readonly onInsertLink: () => void;
		readonly onInsertCodeBlock: () => void;
		readonly onInsertHorizontalRule: () => void;
		readonly onInsertFootnote: () => void;
	}

	const {
		addNoteDisabled = true,
		documentStats,
		selectionStats,
		onAddNote,
		onToggleFormat,
		onToggleHeading,
		onToggleBlockquote,
		onToggleBulletList,
		onToggleNumberedList,
		onToggleTaskList,
		onInsertLink,
		onInsertCodeBlock,
		onInsertHorizontalRule,
		onInsertFootnote
	}: Props = $props();

	let statsOpen = $state(false);
</script>

<footer
	class="flex min-h-[calc(var(--size-control)+var(--spacing-3xs))] items-center justify-between gap-x-s border-t border-rule bg-page/92 px-2xs py-0.5 font-sans text-[0.76rem] text-muted backdrop-blur-md transition-opacity duration-150 group-data-[focused=true]:opacity-35 group-data-[focused=true]:hover:opacity-100 group-data-[focused=true]:focus-within:opacity-100 min-[42.01rem]:px-[max(var(--spacing-s),calc((100vw-var(--max-width-shell))/2+var(--spacing-s)))]"
	aria-label="Formatting and document statistics"
>
	<Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
		<div class="flex items-center gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden">
			<!-- Group 1: Headings Menu (H1 - H6 + Body) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<button
							{...triggerProps}
							class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-0.5 rounded border border-transparent bg-transparent px-1.5 text-[0.74rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Heading options"
						>
							<Heading size={13} strokeWidth={2} />
							<ChevronDown size={10} class="opacity-60" />
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						side="top"
						sideOffset={6}
						class="z-50 min-w-44 rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_97%,var(--color-page))] p-1 font-sans text-[0.78rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.12)] backdrop-blur-md outline-none"
					>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(1)}
						>
							<span class="font-bold text-[0.88rem]">Heading 1</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">#</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(2)}
						>
							<span class="font-semibold text-[0.82rem]">Heading 2</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">##</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(3)}
						>
							<span class="font-medium text-[0.78rem]">Heading 3</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">###</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(4)}
						>
							<span class="text-[0.76rem]">Heading 4</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">####</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(5)}
						>
							<span class="text-[0.74rem]">Heading 5</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">#####</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(6)}
						>
							<span class="text-[0.72rem]">Heading 6</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">######</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-1 h-px bg-rule" />
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(0)}
						>
							<span class="text-[0.76rem] text-muted">Body text</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 2: Emphasis (Bold, Italic, Strikethrough) -->
			<!-- Bold -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] font-bold leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Bold"
							onclick={() => onToggleFormat('**')}
						>
							<Bold size={13} strokeWidth={2.5} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Bold</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">⌘ B</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Italic -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] italic leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Italic"
							onclick={() => onToggleFormat('*')}
						>
							<Italic size={13} strokeWidth={2.5} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Italic</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">⌘ I</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Strikethrough -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Strikethrough"
							onclick={() => onToggleFormat('~~')}
						>
							<Strikethrough size={13} strokeWidth={2.2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Strikethrough</span>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 3: Code & Link (Separated from Bold/Italic/Strikethrough) -->
			<!-- Code Menu -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<button
							{...triggerProps}
							class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-0.5 rounded border border-transparent bg-transparent px-1.5 text-[0.74rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Code options"
						>
							<Code size={13} strokeWidth={2} />
							<ChevronDown size={10} class="opacity-60" />
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						side="top"
						sideOffset={6}
						class="z-50 min-w-36 rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_97%,var(--color-page))] p-1 font-sans text-[0.78rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.12)] backdrop-blur-md outline-none"
					>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleFormat('`')}
						>
							<span>Inline code</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">`</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={onInsertCodeBlock}
						>
							<span>Code block</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">```</kbd>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- Link -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Link"
							onclick={onInsertLink}
						>
							<LinkIcon size={13} strokeWidth={2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Link</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">⌘ K</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 4: Structure (Lists: Bullet, Numbered, Task checklist) -->
			<!-- Bullet list -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Bullet list"
							onclick={onToggleBulletList}
						>
							<List size={13} strokeWidth={2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Bullet list</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">-</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Numbered list -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Numbered list"
							onclick={onToggleNumberedList}
						>
							<ListOrdered size={13} strokeWidth={2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Numbered list</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">1.</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Task checklist -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Task checklist"
							onclick={onToggleTaskList}
						>
							<ListTodo size={13} strokeWidth={2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Task checklist</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">[ ]</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 5: Blocks & Extras (Blockquote, Footnote, Horizontal Rule) -->
			<!-- Blockquote -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Blockquote"
							onclick={onToggleBlockquote}
						>
							<Quote size={13} strokeWidth={2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Blockquote</span>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Footnote -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Footnote"
							onclick={onInsertFootnote}
						>
							<Asterisk size={13} strokeWidth={2.2} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Footnote</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">[^1]</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- Horizontal Rule -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[0.78rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
							type="button"
							aria-label="Horizontal rule"
							onclick={onInsertHorizontalRule}
						>
							<Minus size={13} strokeWidth={2.5} />
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Horizontal rule</span>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
			<!-- Group 6: Note Annotation (Separated from markdown formatting) -->
			<span class="mx-1 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<button
							{...tooltipProps}
							class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-1 rounded border border-transparent bg-transparent px-1.5 text-[0.74rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40"
							disabled={addNoteDisabled}
							type="button"
							aria-label="Add note at selection"
							onclick={onAddNote}
						>
							<SquarePen size={13} strokeWidth={2} />
							<span>Note</span>
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="top"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Add note at selection</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">⌥ A</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</div>
	</Tooltip.Provider>

	<!-- Statistics Popover Trigger (Right Side) -->
	<Popover.Root bind:open={statsOpen}>
		<Popover.Trigger>
			{#snippet child({ props: triggerProps })}
				<button
					{...triggerProps}
					class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.75rem] font-medium text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent"
					type="button"
					aria-label="Show document statistics"
				>
					<span>{documentStats.words} {documentStats.words === 1 ? 'word' : 'words'}</span>
					<ChevronDown size={11} class={['transition-transform duration-150', statsOpen && 'rotate-180']} />
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content
				align="end"
				side="top"
				sideOffset={8}
				class="z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-rule bg-[color-mix(in_srgb,var(--color-paper)_97%,var(--color-page))] p-3.5 font-sans text-[0.78rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.12)] backdrop-blur-md outline-none"
			>
				<div class="mb-2.5 flex items-center justify-between border-b border-rule pb-2">
					<span class="font-medium text-ink">Statistics</span>
					<span class="flex items-center gap-1 text-[0.72rem] font-medium text-accent-ink">
						<Clock size={12} />
						{documentStats.readingTime}
					</span>
				</div>

				<div class="grid grid-cols-2 gap-x-3 gap-y-2 text-[0.76rem]">
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Words</span>
						<span class="font-mono font-medium">{documentStats.words.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Sentences</span>
						<span class="font-mono font-medium">{documentStats.sentences.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Characters</span>
						<span class="font-mono font-medium">{documentStats.characters.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">No spaces</span>
						<span class="font-mono font-medium">{documentStats.charactersWithoutSpaces.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Paragraphs</span>
						<span class="font-mono font-medium">{documentStats.paragraphs.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Tasks</span>
						<span class="font-mono font-medium">
							{#if documentStats.tasks.total > 0}
								{documentStats.tasks.completed}/{documentStats.tasks.total}
							{:else}
								0
							{/if}
						</span>
					</div>
				</div>

				{#if selectionStats && (selectionStats.words > 0 || selectionStats.characters > 0)}
					<div class="mt-3 border-t border-rule pt-2">
						<div class="mb-1.5 text-[0.68rem] font-semibold tracking-wider text-muted uppercase">Selection</div>
						<div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.74rem]">
							<div class="flex items-baseline justify-between">
								<span class="text-muted">Words</span>
								<span class="font-mono font-medium">{selectionStats.words}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">Sentences</span>
								<span class="font-mono font-medium">{selectionStats.sentences}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">Characters</span>
								<span class="font-mono font-medium">{selectionStats.characters}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">No spaces</span>
								<span class="font-mono font-medium">{selectionStats.charactersWithoutSpaces}</span>
							</div>
						</div>
					</div>
				{/if}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</footer>

