<script lang="ts">
	import { DropdownMenu, Toolbar, Tooltip } from 'bits-ui';
	import type { FocusScope, PartOfSpeech, ReviewCheck } from './writer-types';

	interface SyntaxOption {
		readonly className: string;
		readonly label: string;
		readonly part: PartOfSpeech;
	}

	interface ReviewOption {
		readonly check: ReviewCheck;
		readonly label: string;
	}

	interface Props {
		readonly addNoteDisabled: boolean;
		readonly focusMode: boolean;
		readonly focusScope: FocusScope;
		readonly hemingwayMode: boolean;
		readonly notesOpen: boolean;
		readonly onAddNote: () => void;
		readonly onFocusModeChange: (enabled: boolean) => void;
		readonly onFocusScopeChange: (scope: string) => void;
		readonly onGuideOpen: () => void;
		readonly onHemingwayModeChange: (enabled: boolean) => void;
		readonly onNotesOpenChange: (enabled: boolean) => void;
		readonly onOpen: () => Promise<void>;
		readonly onOutlineOpenChange: (enabled: boolean) => void;
		readonly onReviewCheckChange: (check: ReviewCheck, enabled: boolean) => Promise<void>;
		readonly onReviewModeChange: (enabled: boolean) => Promise<void>;
		readonly onSave: () => Promise<void>;
		readonly onSearch: () => void;
		readonly onSyntaxModeChange: (enabled: boolean) => Promise<void>;
		readonly onSyntaxPartChange: (part: PartOfSpeech, enabled: boolean) => void;
		readonly onTypewriterModeChange: (enabled: boolean) => void;
		readonly outlineOpen: boolean;
		readonly reviewChecks: Record<ReviewCheck, boolean>;
		readonly reviewMode: boolean;
		readonly syntaxMode: boolean;
		readonly syntaxParts: Record<PartOfSpeech, boolean>;
		readonly typewriterMode: boolean;
	}

	const syntaxOptions: readonly SyntaxOption[] = [
		{ part: 'Adjective', label: 'Adjectives', className: 'text-syntax-adjective' },
		{ part: 'Noun', label: 'Nouns', className: 'text-syntax-noun' },
		{ part: 'Adverb', label: 'Adverbs', className: 'text-syntax-adverb' },
		{ part: 'Verb', label: 'Verbs', className: 'text-syntax-verb' },
		{ part: 'Conjunction', label: 'Conjunctions', className: 'text-syntax-conjunction' }
	];
	const reviewOptions: readonly ReviewOption[] = [
		{ check: 'weasel', label: 'Weasel Words' },
		{ check: 'illusion', label: 'Repeated Words' },
		{ check: 'so', label: 'Starts With "So"' },
		{ check: 'thereIs', label: 'There Is/Are' },
		{ check: 'passive', label: 'Passive Voice' },
		{ check: 'adverb', label: 'Weak Adverbs' },
		{ check: 'tooWordy', label: 'Wordy Phrases' },
		{ check: 'cliches', label: 'Cliches' },
		{ check: 'eprime', label: 'E-Prime' }
	];

	const {
		addNoteDisabled,
		focusMode,
		focusScope,
		hemingwayMode,
		notesOpen,
		onAddNote,
		onFocusModeChange,
		onFocusScopeChange,
		onGuideOpen,
		onHemingwayModeChange,
		onNotesOpenChange,
		onOpen,
		onOutlineOpenChange,
		onReviewCheckChange,
		onReviewModeChange,
		onSave,
		onSearch,
		onSyntaxModeChange,
		onSyntaxPartChange,
		onTypewriterModeChange,
		outlineOpen,
		reviewChecks,
		reviewMode,
		syntaxMode,
		syntaxParts,
		typewriterMode
	}: Props = $props();
</script>

<header
	class="flex min-h-[calc(var(--control-size)+var(--spacing-2xs))] items-center justify-between border-b border-rule bg-page/92 px-2xs py-3xs font-sans text-muted backdrop-blur-md transition-opacity duration-150 group-data-[focused=true]:opacity-35 group-data-[focused=true]:hover:opacity-100 group-data-[focused=true]:focus-within:opacity-100 min-[42.01rem]:px-[max(var(--spacing-s),calc((100vw-var(--shell-max))/2+var(--spacing-s)))]"
	aria-label="Writing controls"
>
	<Tooltip.Provider delayDuration={400} skipDelayDuration={200}>
		<Toolbar.Root
			class="flex w-full flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[42.01rem]:flex-wrap min-[42.01rem]:overflow-visible"
			loop={false}
		>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							type="button"
							onclick={() => void onOpen()}
						>
							Open
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Open manuscript</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌘O</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							type="button"
							onclick={() => void onSave()}
						>
							Save
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Save draft</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌘S</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<span class="hidden min-[42.01rem]:block min-[42.01rem]:flex-1 min-[42.01rem]:min-w-xs"></span>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
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
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Search in document</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌘F</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={syntaxMode}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							data-mode={syntaxMode ? 'on' : 'off'}
						>
							Syntax
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
							<span>{syntaxMode ? 'Hide Syntax' : 'Show Syntax'}</span>
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

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={focusMode}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							data-mode={focusMode ? 'on' : 'off'}
						>
							Focus
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
							<span>{focusMode ? 'Disable Focus' : 'Enable Focus'}</span>
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

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={hemingwayMode}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
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
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Hemingway mode (write-only)</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌥H</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props: triggerProps })}
						<Toolbar.Button
							{...triggerProps}
							aria-pressed={reviewMode}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							data-mode={reviewMode ? 'on' : 'off'}
						>
							Review
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
							<span>{reviewMode ? 'Disable Review' : 'Enable Review'}</span>
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

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={outlineOpen}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
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
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Document outline</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌥O</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							aria-pressed={notesOpen}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 data-[mode=on]:border-rule data-[mode=on]:bg-paper data-[mode=on]:text-accent-ink min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
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
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Writer’s notes</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌥N</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 disabled:pointer-events-none disabled:opacity-40 min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
							disabled={addNoteDisabled}
							type="button"
							onclick={onAddNote}
						>
							Add Note
						</Toolbar.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side="bottom"
						sideOffset={6}
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Add note at selection</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌥A</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props: tooltipProps })}
						<Toolbar.Button
							{...tooltipProps}
							class="flex min-h-control shrink-0 cursor-pointer items-center rounded border border-transparent bg-transparent px-3xs text-[0.72rem] leading-none text-muted transition-colors select-none hover:border-rule hover:bg-paper hover:text-accent-ink focus-visible:border-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 min-[42.01rem]:px-2xs min-[42.01rem]:text-[0.78rem]"
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
						class="z-50 flex items-center gap-1.5 rounded border border-rule bg-[color-mix(in_srgb,var(--color-paper)_96%,var(--color-page))] px-2 py-1 font-sans text-[0.72rem] text-ink shadow-[0_0.25rem_0.75rem_rgba(34,35,31,0.08)] select-none outline-none"
					>
						<span>Keyboard shortcuts</span>
						<kbd class="rounded border border-rule bg-page px-1 font-mono text-[0.68rem] text-muted">⌘/</kbd>
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</Toolbar.Root>
	</Tooltip.Provider>
</header>
