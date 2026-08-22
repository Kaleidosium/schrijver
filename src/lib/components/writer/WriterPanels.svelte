<script lang="ts">
	import type { OutlineItem } from '$lib/writer-document';
	import { formatForDisplay } from '@tanstack/svelte-hotkeys';
	import { Dialog } from 'bits-ui';
	import { COMMAND_HELP } from './writer-commands';
	import type { NoteView } from './writer-types';
	import WriterNoteEditor from './WriterNoteEditor.svelte';

	interface Props {
		readonly activeNoteId?: string | undefined;
		readonly autofocusNoteId?: string | undefined;
		readonly guideOpen: boolean;
		readonly noteViews: readonly NoteView[];
		readonly notesOpen: boolean;
		readonly onActivateNote: (id: string) => void;
		readonly onAutofocusNote: (id: string) => void;
		readonly onCloseGuide: () => void;
		readonly onDeleteNote: (id: string) => void;
		readonly onJumpToNote: (id: string) => void;
		readonly onJumpToHeading: (item: OutlineItem) => void;
		readonly onReattachNote: (id: string) => void;
		readonly onResolveNote: (id: string, resolved: boolean) => void;
		readonly onUpdateNote: (id: string, body: string) => void;
		readonly outline: readonly OutlineItem[];
		readonly outlineOpen: boolean;
		readonly searchOpen?: boolean;
	}

	const {
		activeNoteId,
		autofocusNoteId,
		guideOpen,
		noteViews,
		notesOpen,
		onActivateNote,
		onAutofocusNote,
		onCloseGuide,
		onDeleteNote,
		onJumpToNote,
		onJumpToHeading,
		onReattachNote,
		onResolveNote,
		onUpdateNote,
		outline,
		outlineOpen,
		searchOpen = false
	}: Props = $props();

	function parseShortcutKeys(shortcut: string): string[] {
		return formatForDisplay(shortcut, { separatorToken: '|' }).split('|');
	}
</script>

{#if outlineOpen}
	<aside
		class={[
			'absolute bottom-0 left-0 z-12 w-[calc(100vw-1rem)] max-w-80 overflow-auto overscroll-contain border-r border-rule bg-[color-mix(in_srgb,var(--color-page)_94%,var(--color-paper))] p-s font-sans text-[0.8rem] text-muted shadow-[0_0.75rem_2rem_rgba(34,35,31,0.12)] transition-[top] duration-150 lg:w-rail lg:shadow-none',
			searchOpen ? 'top-(--search-panel-height)' : 'top-0'
		]}
		aria-label="Document outline"
		data-rail="outline"
	>
		<h2 class="mb-xs text-[0.72rem] font-bold tracking-wider text-ink uppercase">Outline</h2>
		{#if outline.length === 0}
			<p class="m-0 leading-relaxed">Headings appear here.</p>
		{:else}
			<nav class="grid gap-0.5" aria-label="Document headings">
				{#each outline as item (item.id)}
					<button
						aria-label={`Jump to heading: ${item.label}`}
						class="w-full truncate rounded-xs border-0 bg-transparent py-1.5 pr-1.5 text-left text-[0.8rem] text-muted cursor-pointer hover:bg-paper hover:text-accent-ink hover:outline hover:outline-rule focus-visible:bg-paper focus-visible:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
						style:padding-left={`calc(0.4rem + ${(item.level - 1) * 0.65}rem)`}
						type="button"
						onclick={() => onJumpToHeading(item)}
					>
						{item.label}
					</button>
				{/each}
			</nav>
		{/if}
	</aside>
{/if}

{#if notesOpen}
	<aside
		class={[
			'absolute bottom-0 right-0 z-12 w-[calc(100vw-1rem)] max-w-80 overflow-auto overscroll-contain border-l border-rule bg-[color-mix(in_srgb,var(--color-page)_94%,var(--color-paper))] px-xs py-s font-sans text-[0.8rem] text-muted shadow-[0_0.75rem_2rem_rgba(34,35,31,0.12)] transition-[top] duration-150 lg:w-rail lg:shadow-none',
			searchOpen ? 'top-(--search-panel-height)' : 'top-0'
		]}
		aria-label="Writer’s notes"
		data-rail="notes"
	>
		<h2 class="mb-xs text-[0.72rem] font-bold tracking-wider text-ink uppercase">
			Writer’s notes
		</h2>
		{#if noteViews.length === 0}
			<p class="m-0 leading-relaxed">Select text and add a note.</p>
		{:else}
			<div class="relative min-h-auto lg:min-h-full">
				{#each noteViews as view (view.note.id)}
					<article
						class={[
							'mb-2xs grid min-h-36 gap-3xs rounded border border-rule border-l-[3px] border-l-accent bg-paper p-2xs shadow-xs transition-[border-color,background-color,opacity,top] duration-150 lg:absolute lg:right-0 lg:left-0 lg:top-(--note-top) lg:mb-0',
							activeNoteId === view.note.id && 'border-accent',
							view.orphaned && 'border-l-mark',
							view.note.resolved && 'opacity-55'
						]}
						data-active-note={activeNoteId === view.note.id}
						style:--note-top={`${view.top}px`}
						onfocusin={() => onActivateNote(view.note.id)}
					>
						<button
							aria-label={`Jump to note: ${view.orphaned ? 'Anchor missing' : view.anchorLabel}`}
							class="truncate border-0 bg-transparent p-0 text-left text-[0.7rem] text-muted cursor-pointer hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
							type="button"
							onclick={() => onJumpToNote(view.note.id)}
						>
							{view.orphaned ? 'Anchor missing' : view.anchorLabel}
						</button>
						<WriterNoteEditor
							autofocus={autofocusNoteId === view.note.id}
							note={view.note}
							onAutofocus={onAutofocusNote}
							onUpdate={onUpdateNote}
						/>
						<div class="flex justify-end gap-3xs">
							{#if view.orphaned}
								<button
									aria-label={`Reattach note: ${view.anchorLabel}`}
									class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
									type="button"
									onclick={() => onReattachNote(view.note.id)}
								>
									Reattach
								</button>
							{:else}
								<button
									aria-label={`${view.note.resolved ? 'Reopen' : 'Resolve'} note: ${view.anchorLabel}`}
									class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
									type="button"
									onclick={() => onResolveNote(view.note.id, !view.note.resolved)}
								>
									{view.note.resolved ? 'Reopen' : 'Resolve'}
								</button>
							{/if}
							<button
								aria-label={`Delete note: ${view.anchorLabel}`}
								class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
								type="button"
								onclick={() => onDeleteNote(view.note.id)}
							>
								Delete
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</aside>
{/if}

<Dialog.Root open={guideOpen} onOpenChange={(open) => { if (!open) onCloseGuide(); }}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-51 max-h-[min(38rem,calc(100svh-2rem))] w-[min(31rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto overscroll-contain rounded-md border border-rule bg-paper p-m font-sans text-ink shadow-[0_1rem_3rem_rgba(34,35,31,0.16)] outline-none"
		>
			<header class="flex items-center justify-between gap-s">
				<Dialog.Title class="m-0 text-[1.1rem] font-bold text-pretty">Keyboard shortcuts</Dialog.Title>
				<Dialog.Close
					aria-label="Close keyboard shortcuts"
					class="cursor-pointer rounded-xs border border-rule bg-paper px-2 py-1 text-[0.76rem] text-muted hover:border-accent hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
					type="button"
				>
					Close
				</Dialog.Close>
			</header>
			<Dialog.Description class="sr-only">
				Keyboard shortcuts reference for application and editor actions.
			</Dialog.Description>
			{#each ['App', 'Editor'] as scope (scope)}
				<h3 class="mt-s mb-0 text-[0.72rem] font-bold tracking-wider text-muted uppercase">
					{scope}
				</h3>
				<dl class="mt-2xs mb-0">
					{#each COMMAND_HELP.filter((command) => command.scope === scope) as command (command.label)}
						<div class="flex items-center justify-between gap-s border-b border-rule py-2">
							<dt class="m-0 text-[0.84rem] text-ink">{command.label}</dt>
							<dd class="m-0 flex items-center gap-1">
								{#each parseShortcutKeys(command.shortcut) as key, i (`${command.label}-${key}-${i}`)}
									<kbd
										class="inline-flex min-w-6 items-center justify-center rounded border border-rule border-b-2 bg-paper px-1.5 py-0.5 font-mono text-[0.74rem] font-medium text-ink shadow-[0_1px_2px_rgba(34,35,31,0.06)]"
									>
										{key}
									</kbd>
								{/each}
							</dd>
						</div>
					{/each}
				</dl>
			{/each}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
