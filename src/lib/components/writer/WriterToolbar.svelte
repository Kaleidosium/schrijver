<script lang="ts">
	import { formatForDisplay } from '@tanstack/svelte-hotkeys';
	import { DropdownMenu, Toolbar, Tooltip } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';
	import { APP_SHORTCUTS } from './writer-commands';
	import type { FocusScope, PartOfSpeech, ReviewCheck } from './writer-types';

	interface Props {
		readonly actionBarOpen: boolean;
		readonly focusMode: boolean;
		readonly focusScope: FocusScope;
		readonly hasSelection?: boolean;
		readonly hemingwayMode: boolean;
		readonly notesOpen: boolean;
		readonly onActionBarToggle: () => void;
		readonly onClearFormatting: () => void;
		readonly onCopy: () => void;
		readonly onCut: () => void;
		readonly onDelete: () => void;
		readonly onFocusModeChange: (enabled: boolean) => void;
		readonly onFocusScopeChange: (scope: string) => void;
		readonly onGuideOpen: () => void;
		readonly onHemingwayModeChange: (enabled: boolean) => void;
		readonly onNotesOpenChange: (enabled: boolean) => void;
		readonly onOpen: () => Promise<void>;
		readonly onOutlineOpenChange: (enabled: boolean) => void;
		readonly onPaste: () => void;
		readonly onReaderModeToggle: () => void;
		readonly onReviewCheckChange: (check: ReviewCheck, enabled: boolean) => Promise<void>;
		readonly onReviewModeChange: (enabled: boolean) => Promise<void>;
		readonly onSave: () => Promise<void>;
		readonly onSaveAs: () => Promise<void>;
		readonly onSearch: () => void;
		readonly onSelectAll: () => void;
		readonly onSyntaxModeChange: (enabled: boolean) => Promise<void>;
		readonly onSyntaxPartChange: (part: PartOfSpeech, enabled: boolean) => void;
		readonly onTypewriterModeChange: (enabled: boolean) => void;
		readonly onUndo: () => void;
		readonly onZoomIn: () => void;
		readonly onZoomOut: () => void;
		readonly onZoomReset: () => void;
		readonly outlineOpen: boolean;
		readonly readerMode: boolean;
		readonly reviewChecks: Record<ReviewCheck, boolean>;
		readonly reviewMode: boolean;
		readonly searchOpen?: boolean;
		readonly syntaxMode: boolean;
		readonly syntaxParts: Record<PartOfSpeech, boolean>;
		readonly typewriterMode: boolean;
	}

	const syntaxOptions = [
		{ part: 'Adjective', label: 'Adjectives', className: 'text-syntax-adjective' },
		{ part: 'Noun', label: 'Nouns', className: 'text-syntax-noun' },
		{ part: 'Adverb', label: 'Adverbs', className: 'text-syntax-adverb' },
		{ part: 'Verb', label: 'Verbs', className: 'text-syntax-verb' },
		{ part: 'Conjunction', label: 'Conjunctions', className: 'text-syntax-conjunction' }
	] as const satisfies readonly { part: PartOfSpeech; label: string; className: string }[];
	const reviewOptions = [
		{ check: 'weasel', label: 'Weasel words' },
		{ check: 'illusion', label: 'Repeated words' },
		{ check: 'so', label: 'Starts with "so"' },
		{ check: 'thereIs', label: 'There is or are' },
		{ check: 'passive', label: 'Passive voice' },
		{ check: 'adverb', label: 'Weak adverbs' },
		{ check: 'tooWordy', label: 'Wordy phrases' },
		{ check: 'cliches', label: 'Clichés' },
		{ check: 'eprime', label: 'E-Prime' }
	] as const satisfies readonly { check: ReviewCheck; label: string }[];

	const {
		actionBarOpen,
		focusMode,
		focusScope,
		hasSelection = false,
		hemingwayMode,
		notesOpen,
		onActionBarToggle,
		onClearFormatting,
		onCopy,
		onCut,
		onDelete,
		onFocusModeChange,
		onFocusScopeChange,
		onGuideOpen,
		onHemingwayModeChange,
		onNotesOpenChange,
		onOpen,
		onOutlineOpenChange,
		onPaste,
		onReaderModeToggle,
		onReviewCheckChange,
		onReviewModeChange,
		onSave,
		onSaveAs,
		onSearch,
		onSelectAll,
		onSyntaxModeChange,
		onSyntaxPartChange,
		onTypewriterModeChange,
		onUndo,
		onZoomIn,
		onZoomOut,
		onZoomReset,
		outlineOpen,
		readerMode,
		reviewChecks,
		reviewMode,
		searchOpen = false,
		syntaxMode,
		syntaxParts,
		typewriterMode
	}: Props = $props();
</script>

<header
	class="flex min-h-[calc(var(--size-control)+0.5rem)] items-center justify-between border-b border-rule bg-page/92 px-2xs py-1.5 font-sans text-muted backdrop-blur-md transition-opacity duration-150 group-data-[focused=true]:opacity-35 group-data-[focused=true]:hover:opacity-100 group-data-[focused=true]:focus-within:opacity-100 min-[42.01rem]:px-[max(var(--spacing-s),calc((100vw-var(--max-width-shell))/2+var(--spacing-s)))]"
	aria-label="Writing controls"
>
	<Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
		<Toolbar.Root
			class="flex w-full flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden min-[42.01rem]:flex-wrap min-[42.01rem]:overflow-visible"
			loop={false}
		>
			<!-- LEFT CLUSTER: File, Edit, View, Outline, Notes -->

			<!-- 1. File (Dropdown Menu containing Open, Save, Save as) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink min-[42.01rem]:px-2.5"
							type="button"
						>
							<span>File</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						class="z-50 min-w-48 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.84rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={() => void onOpen()}
						>
							<span>Open manuscript</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.open)}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={() => void onSave()}
						>
							<span>Save draft</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.save)}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={() => void onSaveAs()}
						>
							<span>Save as…</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.saveAs)}</kbd>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 2. Edit (Windows 11 Notepad-like Dropdown Menu) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger disabled={readerMode}>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							type="button"
						>
							<span>Edit</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						class="z-50 min-w-48 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.84rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onUndo}
						>
							<span>Undo</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+Z')}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onCut}
						>
							<span>Cut</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+X')}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onCopy}
						>
							<span>Copy</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+C')}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onPaste}
						>
							<span>Paste</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+V')}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onDelete}
						>
							<span>Delete</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Delete')}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onClearFormatting}
						>
							<span>Clear formatting</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onSelectAll}
						>
							<span>Select all</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+A')}</kbd>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 3. View (Dropdown Menu containing Zoom and Action bar toggle) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink min-[42.01rem]:px-2.5"
							type="button"
						>
							<span>View</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						class="z-50 min-w-48 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.84rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onZoomIn}
						>
							<span>Zoom in</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.zoomIn)}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onZoomOut}
						>
							<span>Zoom out</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.zoomOut)}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-pointer items-center justify-between gap-s rounded px-2 select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							onSelect={onZoomReset}
						>
							<span>Restore default zoom</span>
							<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.zoomReset)}</kbd>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.CheckboxItem
							checked={readerMode}
							class="flex min-h-[1.9rem] cursor-default items-center justify-between gap-s rounded px-2xs select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							onCheckedChange={onReaderModeToggle}
						>
							{#snippet children({ checked })}
								<div class="flex items-center gap-2xs">
									<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
										{checked ? '✓' : ''}
									</span>
									<span>Reader mode</span>
								</div>
								<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.preview)}</kbd>
							{/snippet}
						</DropdownMenu.CheckboxItem>
						<DropdownMenu.CheckboxItem
							checked={actionBarOpen}
							class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							onCheckedChange={onActionBarToggle}
						>
							{#snippet children({ checked })}
								<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
									{checked ? '✓' : ''}
								</span>
								<span>Action bar</span>
							{/snippet}
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 2. Outline (Toggle Button) -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={outlineOpen}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2.5"
							data-mode={outlineOpen ? 'on' : 'off'}
							type="button"
							onclick={() => onOutlineOpenChange(!outlineOpen)}
						>
							Outline
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Document outline</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.outline)}</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- 3. Notes (Toggle Button) -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={notesOpen}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={notesOpen ? 'on' : 'off'}
							type="button"
							onclick={() => onNotesOpenChange(!notesOpen)}
						>
							Notes
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Writer’s notes</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.addNote)}</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- SPACER: Separates left group from right group on wide screens -->
			<span class="hidden min-[42.01rem]:block min-[42.01rem]:flex-1 min-[42.01rem]:min-w-xs" aria-hidden="true"></span>

			<!-- RIGHT CLUSTER: Focus, Hemingway, Syntax, Style, Search, Shortcuts -->

			<!-- 5. Focus (Dropdown Menu) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger disabled={readerMode}>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={focusMode}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={focusMode ? 'on' : 'off'}
						>
							<span>Focus</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="end"
						class="z-50 min-w-54 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.86rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							onSelect={() => onFocusModeChange(!focusMode)}
						>
							<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
								{focusMode ? '✓' : ''}
							</span>
							<span>{focusMode ? 'Disable focus' : 'Enable focus'}</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.RadioGroup value={focusScope} onValueChange={onFocusScopeChange}>
							<DropdownMenu.RadioItem
								class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
								closeOnSelect={false}
								disabled={!focusMode}
								value="all"
							>
								{#snippet children({ checked })}
									<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
										{checked ? '✓' : ''}
									</span>
									<span>All</span>
								{/snippet}
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem
								class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
								closeOnSelect={false}
								disabled={!focusMode}
								value="paragraph"
							>
								{#snippet children({ checked })}
									<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
										{checked ? '✓' : ''}
									</span>
									<span>Paragraph</span>
								{/snippet}
							</DropdownMenu.RadioItem>
							<DropdownMenu.RadioItem
								class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
								closeOnSelect={false}
								disabled={!focusMode}
								value="sentence"
							>
								{#snippet children({ checked })}
									<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
										{checked ? '✓' : ''}
									</span>
									<span>Sentence</span>
								{/snippet}
							</DropdownMenu.RadioItem>
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.CheckboxItem
							checked={typewriterMode}
							class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							disabled={!focusMode}
							onCheckedChange={onTypewriterModeChange}
						>
							{#snippet children({ checked })}
								<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
									{checked ? '✓' : ''}
								</span>
								<span>Typewriter</span>
							{/snippet}
						</DropdownMenu.CheckboxItem>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 6. Hemingway (Toggle Button) -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={hemingwayMode}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={hemingwayMode ? 'on' : 'off'}
							type="button"
							onclick={() => onHemingwayModeChange(!hemingwayMode)}
						>
							Hemingway
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Hemingway mode (write-only)</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.hemingway)}</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- 7. Syntax (Dropdown Menu) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger disabled={readerMode}>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={syntaxMode}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={syntaxMode ? 'on' : 'off'}
						>
							<span>Syntax</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="end"
						class="z-50 min-w-54 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.86rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							onSelect={() => void onSyntaxModeChange(!syntaxMode)}
						>
							<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
								{syntaxMode ? '✓' : ''}
							</span>
							<span>{syntaxMode ? 'Hide syntax' : 'Show syntax'}</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.Group>
							{#each syntaxOptions as option (option.part)}
								<DropdownMenu.CheckboxItem
									checked={syntaxParts[option.part]}
									class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
									closeOnSelect={false}
									disabled={!syntaxMode}
									onCheckedChange={(checked) => onSyntaxPartChange(option.part, checked)}
								>
									{#snippet children({ checked })}
										<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
											{checked ? '✓' : ''}
										</span>
										<span class={option.className}>{option.label}</span>
									{/snippet}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 8. Style (Dropdown Menu, formerly Review) -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger disabled={readerMode}>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={reviewMode}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink data-[state=open]:border-rule data-[state=open]:bg-paper data-[state=open]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={reviewMode ? 'on' : 'off'}
						>
							<span>Style</span>
							<ChevronDown size={11} class="opacity-60 transition-transform duration-150" aria-hidden="true" />
						</Toolbar.Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="end"
						class="z-50 min-w-54 max-w-[calc(100vw-1rem)] rounded-md border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] p-3xs font-sans text-[0.86rem] text-ink shadow-[0_0.5rem_1.5rem_rgba(34,35,31,0.1)] outline-none"
						sideOffset={6}
					>
						<DropdownMenu.Item
							class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
							closeOnSelect={false}
							onSelect={() => void onReviewModeChange(!reviewMode)}
						>
							<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
								{reviewMode ? '✓' : ''}
							</span>
							<span>{reviewMode ? 'Disable style' : 'Enable style'}</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="my-3xs mx-2xs h-px bg-rule" />
						<DropdownMenu.Group>
							{#each reviewOptions as option (option.check)}
								<DropdownMenu.CheckboxItem
									checked={reviewChecks[option.check]}
									class="flex min-h-[1.9rem] cursor-default items-center gap-2xs rounded px-2xs select-none outline-none data-disabled:opacity-40 data-highlighted:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)]"
									closeOnSelect={false}
									disabled={!reviewMode}
									onCheckedChange={(checked) =>
										void onReviewCheckChange(option.check, checked)}
								>
									{#snippet children({ checked })}
										<span class="w-[1.2rem] shrink-0 text-center font-bold text-ink" aria-hidden="true">
											{checked ? '✓' : ''}
										</span>
										<span>{option.label}</span>
									{/snippet}
								</DropdownMenu.CheckboxItem>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<!-- 9. Search (Toggle Action Button) -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={searchOpen}
							disabled={readerMode}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2.5"
							data-mode={searchOpen ? 'on' : 'off'}
							type="button"
							onclick={onSearch}
						>
							Search
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Search in document</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay('Mod+F')}</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<!-- 10. Shortcuts (Dialog Trigger) -->
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex h-7 min-h-7 shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-2 text-[0.78rem] font-medium leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 min-[42.01rem]:px-2.5"
							type="button"
							onclick={onGuideOpen}
						>
							Shortcuts
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-2 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2.5 py-1.5 font-sans text-[0.74rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Keyboard shortcuts</span>
						<kbd class="rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[0.72rem] font-medium tracking-wide text-ink/80 shadow-[0_1px_1px_rgba(34,35,31,0.05)]">{formatForDisplay(APP_SHORTCUTS.guide)}</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Toolbar.Root>
	</Tooltip.Provider>
</header>

