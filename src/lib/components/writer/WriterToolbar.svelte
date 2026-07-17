<script lang="ts">
	import { DropdownMenu, Toolbar } from 'bits-ui';
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
		{ part: 'Adjective', label: 'Adjectives', className: 'syntax-adjective' },
		{ part: 'Noun', label: 'Nouns', className: 'syntax-noun' },
		{ part: 'Adverb', label: 'Adverbs', className: 'syntax-adverb' },
		{ part: 'Verb', label: 'Verbs', className: 'syntax-verb' },
		{ part: 'Conjunction', label: 'Conjunctions', className: 'syntax-conjunction' }
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

<header class="topbar" aria-label="Writing controls">
	<Toolbar.Root class="actions" loop={false}>
		<Toolbar.Button class="toolbar-button" type="button" onclick={() => void onOpen()}>
			Open
		</Toolbar.Button>
		<Toolbar.Button class="toolbar-button" type="button" onclick={() => void onSave()}>
			Save
		</Toolbar.Button>
		<span class="toolbar-spacer"></span>
		<Toolbar.Button class="toolbar-button" type="button" onclick={onSearch}>Search</Toolbar.Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				aria-pressed={syntaxMode}
				class="toolbar-button"
				data-mode={syntaxMode ? 'on' : 'off'}
			>
				Syntax
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content align="end" class="feature-menu" sideOffset={6}>
					<DropdownMenu.Item
						class="feature-menu-item"
						closeOnSelect={false}
						onSelect={() => void onSyntaxModeChange(!syntaxMode)}
					>
						<span class="feature-menu-check" aria-hidden="true">{syntaxMode ? '✓' : ''}</span>
						<span>{syntaxMode ? 'Hide Syntax' : 'Show Syntax'}</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="feature-menu-separator" />
					{#each syntaxOptions as option (option.part)}
						<DropdownMenu.CheckboxItem
							checked={syntaxParts[option.part]}
							class="feature-menu-item"
							closeOnSelect={false}
							disabled={!syntaxMode}
							onCheckedChange={(checked) => onSyntaxPartChange(option.part, checked)}
						>
							<span class="feature-menu-check" aria-hidden="true">
								{syntaxParts[option.part] ? '✓' : ''}
							</span>
							<span class={option.className}>{option.label}</span>
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				aria-pressed={focusMode}
				class="toolbar-button"
				data-mode={focusMode ? 'on' : 'off'}
			>
				Focus
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content align="end" class="feature-menu" sideOffset={6}>
					<DropdownMenu.Item
						class="feature-menu-item"
						closeOnSelect={false}
						onSelect={() => onFocusModeChange(!focusMode)}
					>
						<span class="feature-menu-check" aria-hidden="true">{focusMode ? '✓' : ''}</span>
						<span>{focusMode ? 'Disable Focus' : 'Enable Focus'}</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="feature-menu-separator" />
					<DropdownMenu.RadioGroup value={focusScope} onValueChange={onFocusScopeChange}>
						<DropdownMenu.RadioItem
							class="feature-menu-item"
							closeOnSelect={false}
							disabled={!focusMode}
							value="all"
						>
							<span class="feature-menu-check" aria-hidden="true">
								{focusScope === 'all' ? '✓' : ''}
							</span>
							<span>All</span>
						</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem
							class="feature-menu-item"
							closeOnSelect={false}
							disabled={!focusMode}
							value="paragraph"
						>
							<span class="feature-menu-check" aria-hidden="true">
								{focusScope === 'paragraph' ? '✓' : ''}
							</span>
							<span>Paragraph</span>
						</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem
							class="feature-menu-item"
							closeOnSelect={false}
							disabled={!focusMode}
							value="sentence"
						>
							<span class="feature-menu-check" aria-hidden="true">
								{focusScope === 'sentence' ? '✓' : ''}
							</span>
							<span>Sentence</span>
						</DropdownMenu.RadioItem>
					</DropdownMenu.RadioGroup>
					<DropdownMenu.Separator class="feature-menu-separator" />
					<DropdownMenu.CheckboxItem
						checked={typewriterMode}
						class="feature-menu-item"
						closeOnSelect={false}
						disabled={!focusMode}
						onCheckedChange={onTypewriterModeChange}
					>
						<span class="feature-menu-check" aria-hidden="true">
							{typewriterMode ? '✓' : ''}
						</span>
						<span>Typewriter</span>
					</DropdownMenu.CheckboxItem>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
		<Toolbar.Button
			aria-pressed={hemingwayMode}
			class="toolbar-button"
			data-mode={hemingwayMode ? 'on' : 'off'}
			type="button"
			onclick={() => onHemingwayModeChange(!hemingwayMode)}
		>
			Hemingway
		</Toolbar.Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				aria-pressed={reviewMode}
				class="toolbar-button"
				data-mode={reviewMode ? 'on' : 'off'}
			>
				Review
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content align="end" class="feature-menu" sideOffset={6}>
					<DropdownMenu.Item
						class="feature-menu-item"
						closeOnSelect={false}
						onSelect={() => void onReviewModeChange(!reviewMode)}
					>
						<span class="feature-menu-check" aria-hidden="true">{reviewMode ? '✓' : ''}</span>
						<span>{reviewMode ? 'Disable Review' : 'Enable Review'}</span>
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="feature-menu-separator" />
					{#each reviewOptions as option (option.check)}
						<DropdownMenu.CheckboxItem
							checked={reviewChecks[option.check]}
							class="feature-menu-item"
							closeOnSelect={false}
							disabled={!reviewMode}
							onCheckedChange={(checked) =>
								void onReviewCheckChange(option.check, checked)}
						>
							<span class="feature-menu-check" aria-hidden="true">
								{reviewChecks[option.check] ? '✓' : ''}
							</span>
							<span>{option.label}</span>
						</DropdownMenu.CheckboxItem>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
		<Toolbar.Button
			aria-pressed={outlineOpen}
			class="toolbar-button"
			data-mode={outlineOpen ? 'on' : 'off'}
			type="button"
			onclick={() => onOutlineOpenChange(!outlineOpen)}
		>
			Outline
		</Toolbar.Button>
		<Toolbar.Button
			aria-pressed={notesOpen}
			class="toolbar-button"
			data-mode={notesOpen ? 'on' : 'off'}
			type="button"
			onclick={() => onNotesOpenChange(!notesOpen)}
		>
			Notes
		</Toolbar.Button>
		<Toolbar.Button
			class="toolbar-button"
			disabled={addNoteDisabled}
			type="button"
			onclick={onAddNote}
		>
			Add Note
		</Toolbar.Button>
		<Toolbar.Button class="toolbar-button" type="button" onclick={onGuideOpen}>
			Shortcuts
		</Toolbar.Button>
	</Toolbar.Root>
</header>
