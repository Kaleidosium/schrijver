<script lang="ts">
	import type { OutlineItem } from '$lib/writer-document';
	import { COMMAND_HELP } from './writer-commands';
	import type { NoteView } from './writer-types';
	import WriterNoteEditor from './WriterNoteEditor.svelte';

	interface Props {
		readonly activeNoteId?: string;
		readonly autofocusNoteId?: string;
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
		outlineOpen
	}: Props = $props();
</script>

{#if outlineOpen}
	<aside class="writer-rail writer-outline" aria-label="Document outline">
		<header class="rail-heading">Outline</header>
		{#if outline.length === 0}
			<p class="rail-empty">Headings appear here.</p>
		{:else}
			<nav class="outline-list" aria-label="Document headings">
				{#each outline as item (item.id)}
					<button
						class="outline-link"
						style:--outline-depth={item.level - 1}
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
	<aside class="writer-rail writer-notes" aria-label="Writer’s Notes">
		<header class="rail-heading">Writer’s Notes</header>
		{#if noteViews.length === 0}
			<p class="rail-empty">Select text and add a note.</p>
		{:else}
			<div class="notes-list">
				{#each noteViews as view (view.note.id)}
					<article
						class:active-note={activeNoteId === view.note.id}
						class:orphaned-note={view.orphaned}
						class:resolved-note={view.note.resolved}
						class="writer-note"
						data-active-note={activeNoteId === view.note.id}
						style:--note-top={`${view.top}px`}
						onfocusin={() => onActivateNote(view.note.id)}
					>
						<button
							class="note-anchor"
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
						<div class="note-actions">
							{#if view.orphaned}
								<button type="button" onclick={() => onReattachNote(view.note.id)}>
									Reattach
								</button>
							{:else}
								<button
									type="button"
									onclick={() => onResolveNote(view.note.id, !view.note.resolved)}
								>
									{view.note.resolved ? 'Reopen' : 'Resolve'}
								</button>
							{/if}
							<button type="button" onclick={() => onDeleteNote(view.note.id)}>Delete</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</aside>
{/if}

{#if guideOpen}
	<div class="dialog-backdrop">
		<div
			aria-labelledby="shortcut-guide-title"
			aria-modal="true"
			class="shortcut-guide"
			role="dialog"
		>
			<header>
				<h2 id="shortcut-guide-title">Keyboard shortcuts</h2>
				<button aria-label="Close keyboard shortcuts" type="button" onclick={onCloseGuide}>
					Close
				</button>
			</header>
			{#each ['App', 'Editor'] as scope (scope)}
				<h3>{scope}</h3>
				<dl>
					{#each COMMAND_HELP.filter((command) => command.scope === scope) as command (command.label)}
						<div>
							<dt>{command.label}</dt>
							<dd><kbd>{command.shortcut}</kbd></dd>
						</div>
					{/each}
				</dl>
			{/each}
		</div>
	</div>
{/if}
