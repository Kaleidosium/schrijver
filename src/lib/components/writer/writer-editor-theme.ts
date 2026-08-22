import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export const markdownHighlightStyle = HighlightStyle.define([
	{
		tag: tags.heading,
		color: 'var(--color-ink)',
		fontWeight: '700',
		textDecoration: 'none'
	},
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strong, fontWeight: '700' },
	{ tag: tags.strikethrough, textDecoration: 'line-through' },
	{
		tag: [tags.link, tags.url, tags.monospace],
		color: 'var(--color-accent-ink)'
	},
	{
		tag: [tags.processingInstruction, tags.atom, tags.contentSeparator],
		color: 'color-mix(in srgb, var(--color-muted) 55%, var(--color-page))',
		fontStyle: 'normal',
		fontWeight: '400',
		textDecoration: 'none'
	}
]);

export const writerNoteTheme = EditorView.theme({
	'&': {
		width: '100%',
		minHeight: '4.5rem',
		backgroundColor: 'transparent',
		color: 'var(--color-ink)',
		fontSize: '0.82rem'
	},
	'&.cm-focused': {
		boxShadow: 'inset 0 -1px var(--color-accent)',
		outline: 'none'
	},
	'.cm-scroller': {
		overflow: 'auto',
		fontFamily: 'monospace',
		lineHeight: '1.45'
	},
	'.cm-content': {
		minHeight: '4.5rem',
		padding: '0',
		caretColor: 'transparent'
	},
	'.cm-line': {
		padding: '0'
	},
	'.cm-selectionBackground, .cm-content ::selection': {
		backgroundColor: 'var(--color-selection)'
	},
	'.cm-cursor': {
		borderLeft: '1px solid var(--color-accent)',
		borderLeftColor: 'var(--color-accent)'
	},
	'.cm-placeholder': {
		color: 'color-mix(in srgb, var(--color-muted) 65%, transparent)'
	}
});

export const writerTheme = EditorView.theme({
	'&': {
		height: '100%',
		minHeight: '100%',
		backgroundColor: 'transparent',
		color: 'var(--color-ink)'
	},
	'&.cm-focused': {
		outline: 'none'
	},
	'.cm-scroller': {
		containerType: 'size',
		display: 'flex',
		justifyContent: 'center',
		height: '100%',
		minHeight: '100%',
		fontFamily: 'monospace',
		fontSize: 'calc(1.5em * var(--editor-zoom-factor, 1))',
		lineHeight: '1.75',
		scrollPaddingBlock: 'clamp(2.5rem, 2rem + 1.5vw, 3.5rem)',
		transition: 'padding 150ms ease'
	},
	'.cm-content': {
		flex: '0 1 70ch',
		width: '100%',
		maxWidth: '70ch',
		minHeight: '100%',
		margin: '0 auto',
		padding: 'var(--editor-block-space) var(--editor-inline-space)',
		caretColor: 'var(--color-accent)',
		fontFamily: 'inherit',
		lineHeight: 'inherit'
	},
	'&.cm-typewriter .cm-content': {
		paddingBlock: 'max(var(--editor-block-space), calc(50cqh - 0.875em))'
	},
	'.cm-line': {
		padding: '0',
		fontFamily: 'inherit',
		lineHeight: 'inherit'
	},
	'.cm-selectionBackground, .cm-content ::selection': {
		backgroundColor: 'var(--color-selection)'
	},
	'.cm-cursor': {
		borderLeftColor: 'var(--color-accent)'
	},
	'.cm-panels': {
		borderColor: 'var(--color-rule)',
		backgroundColor: 'var(--color-page)',
		color: 'var(--color-muted)',
		fontFamily:
			"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		fontSize: '0.9rem'
	},
	'.cm-panels-top': {
		position: 'absolute',
		top: '0',
		left: '0',
		right: '0',
		zIndex: '20',
		borderBottom: '1px solid var(--color-rule)',
		boxShadow: '0 0.35rem 0.9rem rgba(34, 35, 31, 0.05)'
	},
	'.cm-panels-bottom': {
		borderTop: '1px solid var(--color-rule)'
	},
	'.cm-panel': {
		padding: 'var(--spacing-3xs) var(--spacing-xs)'
	},
	'.cm-panel.cm-search': {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1fr) auto',
		rowGap: '0.35rem',
		columnGap: '0.4rem',
		alignItems: 'center',
		paddingBlock: '0.45rem',
		paddingRight:
			'max(var(--spacing-s), calc((100vw - var(--max-width-shell)) / 2 + var(--spacing-s)))',
		paddingLeft:
			'calc(max(var(--spacing-s), calc((100vw - var(--max-width-shell)) / 2 + var(--spacing-s))) + 0.625rem)',
		backgroundColor: 'color-mix(in srgb, var(--color-page) 92%, var(--color-paper))',
		borderBottom: '1px solid var(--color-rule)',
		fontFamily:
			"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
		lineHeight: '1',
		fontSize: '0.82rem'
	},
	'.cm-panel.cm-search br': {
		display: 'none'
	},
	'.cm-search-row, .cm-replace-row': {
		display: 'contents'
	},
	'.cm-search-input-box': {
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		minWidth: '0',
		height: '2rem',
		border: '1px solid var(--color-rule)',
		borderRadius: '4px',
		backgroundColor: 'color-mix(in srgb, var(--color-paper) 88%, var(--color-page))',
		padding: '0 0.25rem 0 0.55rem',
		transition: 'border-color 0.12s, box-shadow 0.12s'
	},
	'.cm-search-input-box:focus-within': {
		borderColor: 'var(--color-accent)',
		boxShadow: '0 0 0 1px var(--color-accent)'
	},
	'.cm-search-input-field': {
		flex: '1 1 0%',
		minWidth: '0',
		height: '100%',
		background: 'transparent',
		border: 'none',
		outline: 'none',
		padding: '0',
		margin: '0',
		fontFamily: 'inherit',
		fontSize: '0.8rem',
		color: 'var(--color-ink)'
	},
	'.cm-search-input-field::placeholder': {
		color: 'color-mix(in srgb, var(--color-muted) 65%, transparent)'
	},
	'.cm-search-input-toggles': {
		display: 'flex',
		alignItems: 'center',
		gap: '0.15rem',
		marginLeft: '0.35rem'
	},
	'.cm-search-toggle-btn': {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '1.45rem',
		minWidth: '1.5rem',
		padding: '0 0.35rem',
		border: '1px solid transparent',
		borderRadius: '3px',
		background: 'transparent',
		color: 'var(--color-muted)',
		fontFamily: 'inherit',
		fontSize: '0.72rem',
		fontWeight: '600',
		cursor: 'pointer',
		userSelect: 'none',
		transition: 'background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease'
	},
	'.cm-search-toggle-btn:hover': {
		backgroundColor: 'color-mix(in srgb, var(--color-page) 80%, var(--color-paper))',
		color: 'var(--color-ink)'
	},
	'.cm-search-toggle-btn[aria-pressed="true"]': {
		backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, var(--color-paper))',
		borderColor: 'color-mix(in srgb, var(--color-accent) 45%, var(--color-rule))',
		color: 'var(--color-accent-ink)'
	},
	'.cm-search-toggle-btn:focus-visible': {
		outline: '2px solid var(--color-accent)',
		outlineOffset: '1px'
	},
	'.cm-search-toggle-word .cm-search-word-label': {
		borderBottom: '1.5px solid currentColor',
		lineHeight: '1.1'
	},
	'.cm-search-actions': {
		display: 'flex',
		alignItems: 'center',
		gap: '0.2rem',
		flexShrink: '0'
	},
	'.cm-replace-actions': {
		display: 'flex',
		alignItems: 'center',
		gap: '0.2rem',
		flexShrink: '0',
		justifySelf: 'start'
	},
	'.cm-search-action-btn': {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '1.75rem',
		height: '1.75rem',
		padding: '0',
		border: '1px solid transparent',
		borderRadius: '4px',
		background: 'transparent',
		color: 'var(--color-muted)',
		cursor: 'pointer',
		transition: 'background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease'
	},
	'.cm-search-action-btn:hover': {
		backgroundColor: 'var(--color-paper)',
		borderColor: 'var(--color-rule)',
		color: 'var(--color-accent-ink)'
	},
	'.cm-search-action-btn:focus-visible': {
		outline: '2px solid var(--color-accent)',
		outlineOffset: '1px',
		backgroundColor: 'var(--color-paper)',
		borderColor: 'var(--color-rule)'
	},
	'.cm-search-action-btn[disabled]': {
		cursor: 'default',
		opacity: '0.35',
		pointerEvents: 'none'
	},
	'.cm-search-count-badge': {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: '2.75rem',
		padding: '0 0.25rem',
		fontFamily: 'inherit',
		fontSize: '0.74rem',
		fontVariantNumeric: 'tabular-nums',
		color: 'var(--color-muted)',
		userSelect: 'none'
	},
	'.cm-search-spacer': {
		display: 'inline-block',
		width: '1.75rem',
		height: '1.75rem',
		flexShrink: '0'
	},
	'.cm-search-v-sep': {
		width: '1px',
		height: '1rem',
		backgroundColor: 'var(--color-rule)',
		margin: '0 0.15rem',
		flexShrink: '0'
	},
	'@media (max-width: 48rem)': {
		'.cm-panel.cm-search': {
			paddingBlock: '0.35rem',
			paddingRight: '0.5rem',
			paddingLeft: '1rem'
		},
		'.cm-search-count-badge': {
			minWidth: '2.2rem',
			fontSize: '0.7rem'
		}
	},
	'.cm-searchMatch': {
		backgroundColor: 'color-mix(in srgb, var(--color-mark) 24%, transparent)'
	},
	'.cm-searchMatch.cm-searchMatch-selected': {
		backgroundColor: 'color-mix(in srgb, var(--color-mark) 36%, transparent)'
	},
	'.cm-tooltip-lint': {
		margin: '0',
		padding: '0.55rem 0.7rem',
		border: '1px solid color-mix(in srgb, var(--color-rule) 72%, var(--color-paper))',
		backgroundColor: 'color-mix(in srgb, var(--color-paper) 92%, var(--color-page))',
		boxShadow: '0 0.35rem 1rem rgba(34, 35, 31, 0.08)',
		color: 'var(--color-ink)',
		fontFamily:
			"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		fontSize: '0.82rem',
		lineHeight: '1.45',
		listStyle: 'none',
		maxWidth: 'min(22rem, calc(100vw - 2rem))'
	},
	'.cm-tooltip-lint .cm-diagnostic': {
		margin: '0',
		borderLeft: '0',
		backgroundColor: 'transparent',
		color: 'inherit',
		padding: '0'
	},
	'.cm-tooltip-lint .cm-diagnostic + .cm-diagnostic': {
		marginTop: 'var(--spacing-3xs)',
		paddingTop: 'var(--spacing-3xs)',
		borderTop: '1px solid color-mix(in srgb, var(--color-paper) 18%, transparent)'
	},
	'.cm-tooltip-lint .cm-diagnosticText': {
		display: 'block',
		color: 'inherit'
	},
	'.cm-lintRange.cm-prose-diagnostic': {
		backgroundImage: 'none',
		backgroundColor: 'rgba(255, 221, 92, 0.24)',
		borderRadius: '0.08em',
		boxDecorationBreak: 'clone',
		padding: '0 0.04em'
	},
	'.cm-content ::spelling-error': {
		textDecorationLine: 'underline',
		textDecorationStyle: 'dotted',
		textDecorationColor: '#d13d3d',
		textDecorationThickness: '0.08em',
		textUnderlineOffset: '0.16em',
		WebkitTextDecorationLine: 'underline',
		WebkitTextDecorationStyle: 'dotted',
		WebkitTextDecorationColor: '#d13d3d',
		WebkitTextUnderlineOffset: '0.16em'
	},
	'.cm-focus-dim': {
		opacity: '0.18',
		transition: 'opacity 120ms ease'
	},
	'.cm-focus-context': {
		opacity: '0.45',
		transition: 'opacity 120ms ease'
	},
	'.cm-pos': {
		textDecorationLine: 'none'
	},
	'.cm-pos-adjective': {
		color: '#8a6500'
	},
	'.cm-lintRange.cm-prose-diagnostic .cm-pos-adjective, .cm-pos-adjective .cm-lintRange.cm-prose-diagnostic':
		{
			color: '#5f4700'
		},
	'.cm-lintRange.cm-prose-diagnostic.cm-pos-adjective': {
		color: '#5f4700'
	},
	'.cm-pos-noun': {
		color: '#b84a4a'
	},
	'.cm-pos-adverb': {
		color: '#7657a6'
	},
	'.cm-pos-verb': {
		color: '#2f6db5'
	},
	'.cm-pos-conjunction': {
		color: '#2f7d4a'
	},
	'.cm-heading-mark': {
		position: 'relative',
		left: 'calc(-1 * var(--heading-marker-width))',
		display: 'inline-block',
		width: '0',
		color: 'var(--color-muted)',
		opacity: '0.55',
		whiteSpace: 'pre'
	},
	'@media (max-width: 60rem)': {
		'.cm-heading-mark': {
			position: 'static',
			left: 'auto',
			width: 'auto'
		}
	}
});
