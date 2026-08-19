<script lang="ts">
	import { formatForDisplay } from '@tanstack/svelte-hotkeys';
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
	import { APP_SHORTCUTS } from './writer-commands';

	interface Props {
		readonly addNoteDisabled?: boolean | undefined;
		readonly disabled?: boolean | undefined;
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
		disabled = false,
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
		<div
			class={[
				"flex items-center gap-0.5 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden",
				disabled && "pointer-events-none opacity-40 select-none"
			]}
			aria-disabled={disabled}
		>
			<!-- Group 1: Headings Menu (H1 - H6 + Body) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<button
							{...triggerProps}
							class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-0.5 rounded border border-transparent bg-transparent px-1.5 text-[0.74rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
							type="button"
							aria-label="Heading options"
						>
							<Heading size={13} strokeWidth={2} aria-hidden="true" />
							<ChevronDown size={10} class="opacity-60" aria-hidden="true" />
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
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(1)}
						>
							<span class="font-bold text-[0.88rem]">Heading 1</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">#</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(2)}
						>
							<span class="font-semibold text-[0.82rem]">Heading 2</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">##</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(3)}
						>
							<span class="font-medium text-[0.78rem]">Heading 3</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">###</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(4)}
						>
							<span class="text-[0.76rem]">Heading 4</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">####</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(5)}
						>
							<span class="text-[0.74rem]">Heading 5</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">#####</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(6)}
						>
							<span class="text-[0.72rem]">Heading 6</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">######</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-1 h-px bg-rule" />
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleHeading(0)}
						>
							<span class="text-[0.76rem] text-muted">Body text</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{#snippet toolBtn({
				label,
				shortcut,
				onclick,
				disabled: btnDisabled = false,
				icon,
				extraClass = '',
				btnLabel
			}: {
				label: string;
				shortcut?: string | undefined;
				onclick?: (() => void) | undefined;
				disabled?: boolean | undefined;
				icon: import('svelte').Snippet;
				extraClass?: string | undefined;
				btnLabel?: string | undefined;
			})}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props: tooltipProps })}
							<button
								{...tooltipProps}
								class={[
									'flex h-6 min-h-6 shrink-0 cursor-pointer items-center justify-center rounded border border-transparent bg-transparent leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40',
									btnLabel ? 'gap-1 px-1.5 text-[0.74rem] font-medium' : 'w-6 text-[0.78rem]',
									extraClass
								]}
								type="button"
								aria-label={label}
								disabled={btnDisabled}
								{onclick}
							>
								{@render icon()}
								{#if btnLabel}
									<span>{btnLabel}</span>
								{/if}
							</button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content
							side="top"
							sideOffset={6}
							class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
						>
							<span>{label}</span>
							{#if shortcut}
								<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">
									{formatForDisplay(shortcut)}
								</kbd>
							{/if}
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>
			{/snippet}

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 2: Emphasis (Bold, Italic, Strikethrough) -->
			{@render toolBtn({
				label: 'Bold',
				shortcut: 'Mod+B',
				extraClass: 'font-bold',
				onclick: () => onToggleFormat('**'),
				icon: boldIcon
			})}
			{#snippet boldIcon()}<Bold size={13} strokeWidth={2.5} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Italic',
				shortcut: 'Mod+I',
				extraClass: 'italic',
				onclick: () => onToggleFormat('*'),
				icon: italicIcon
			})}
			{#snippet italicIcon()}<Italic size={13} strokeWidth={2.5} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Strikethrough',
				onclick: () => onToggleFormat('~~'),
				icon: strikeIcon
			})}
			{#snippet strikeIcon()}<Strikethrough size={13} strokeWidth={2.2} aria-hidden="true" />{/snippet}

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 3: Code & Link -->
			<!-- Code Menu -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<button
							{...triggerProps}
							class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-0.5 rounded border border-transparent bg-transparent px-1.5 text-[0.74rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
							type="button"
							aria-label="Code options"
						>
							<Code size={13} strokeWidth={2} aria-hidden="true" />
							<ChevronDown size={10} class="opacity-60" aria-hidden="true" />
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
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={() => onToggleFormat('`')}
						>
							<span>Inline code</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">`</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-7 cursor-pointer items-center justify-between rounded px-2 select-none outline-none hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onclick={onInsertCodeBlock}
						>
							<span>Code block</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.70rem] font-medium text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">```</kbd>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{@render toolBtn({
				label: 'Link',
				shortcut: 'Mod+K',
				onclick: onInsertLink,
				icon: linkIcon
			})}
			{#snippet linkIcon()}<LinkIcon size={13} strokeWidth={2} aria-hidden="true" />{/snippet}

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 4: Structure (Lists: Bullet, Numbered, Task checklist) -->
			{@render toolBtn({
				label: 'Bullet list',
				shortcut: '-',
				onclick: onToggleBulletList,
				icon: listIcon
			})}
			{#snippet listIcon()}<List size={13} strokeWidth={2} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Numbered list',
				shortcut: '1.',
				onclick: onToggleNumberedList,
				icon: listOrdIcon
			})}
			{#snippet listOrdIcon()}<ListOrdered size={13} strokeWidth={2} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Task checklist',
				shortcut: '[ ]',
				onclick: onToggleTaskList,
				icon: taskIcon
			})}
			{#snippet taskIcon()}<ListTodo size={13} strokeWidth={2} aria-hidden="true" />{/snippet}

			<span class="mx-0.5 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			<!-- Group 5: Blocks & Extras (Blockquote, Footnote, Horizontal Rule) -->
			{@render toolBtn({
				label: 'Blockquote',
				onclick: onToggleBlockquote,
				icon: quoteIcon
			})}
			{#snippet quoteIcon()}<Quote size={13} strokeWidth={2} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Footnote',
				shortcut: '[^1]',
				onclick: onInsertFootnote,
				icon: footnoteIcon
			})}
			{#snippet footnoteIcon()}<Asterisk size={13} strokeWidth={2.2} aria-hidden="true" />{/snippet}

			{@render toolBtn({
				label: 'Horizontal rule',
				onclick: onInsertHorizontalRule,
				icon: hrIcon
			})}
			{#snippet hrIcon()}<Minus size={13} strokeWidth={2.5} aria-hidden="true" />{/snippet}

			<!-- Group 6: Note Annotation -->
			<span class="mx-1 h-3.5 w-px bg-rule" aria-hidden="true"></span>

			{@render toolBtn({
				label: 'Add note at selection',
				shortcut: APP_SHORTCUTS.addNote,
				btnLabel: 'Add note',
				disabled: addNoteDisabled,
				onclick: onAddNote,
				icon: noteIcon
			})}
			{#snippet noteIcon()}<SquarePen size={13} strokeWidth={2} aria-hidden="true" />{/snippet}
		</div>
	</Tooltip.Provider>

	<!-- Statistics Popover Trigger (Right Side) -->
	<Popover.Root bind:open={statsOpen}>
		<Popover.Trigger>
			{#snippet child({ props: triggerProps })}
				<button
					{...triggerProps}
					class="flex h-6 min-h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.75rem] font-medium text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
					type="button"
					aria-label="Show document statistics"
				>
					<span class="tabular-nums">{documentStats.words.toLocaleString()} {documentStats.words === 1 ? 'word' : 'words'}</span>
					<ChevronDown size={11} class={['transition-transform duration-150', statsOpen && 'rotate-180']} aria-hidden="true" />
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
						<Clock size={12} aria-hidden="true" />
						{documentStats.readingTime}
					</span>
				</div>

				<div class="grid grid-cols-2 gap-x-3 gap-y-2 text-[0.76rem]">
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Words</span>
						<span class="font-mono font-medium tabular-nums">{documentStats.words.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Sentences</span>
						<span class="font-mono font-medium tabular-nums">{documentStats.sentences.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Characters</span>
						<span class="font-mono font-medium tabular-nums">{documentStats.characters.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">No spaces</span>
						<span class="font-mono font-medium tabular-nums">{documentStats.charactersWithoutSpaces.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Paragraphs</span>
						<span class="font-mono font-medium tabular-nums">{documentStats.paragraphs.toLocaleString()}</span>
					</div>
					<div class="flex items-baseline justify-between">
						<span class="text-muted">Tasks</span>
						<span class="font-mono font-medium tabular-nums">
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
								<span class="font-mono font-medium tabular-nums">{selectionStats.words.toLocaleString()}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">Sentences</span>
								<span class="font-mono font-medium tabular-nums">{selectionStats.sentences.toLocaleString()}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">Characters</span>
								<span class="font-mono font-medium tabular-nums">{selectionStats.characters.toLocaleString()}</span>
							</div>
							<div class="flex items-baseline justify-between">
								<span class="text-muted">No spaces</span>
								<span class="font-mono font-medium tabular-nums">{selectionStats.charactersWithoutSpaces.toLocaleString()}</span>
							</div>
						</div>
					</div>
				{/if}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</footer>

