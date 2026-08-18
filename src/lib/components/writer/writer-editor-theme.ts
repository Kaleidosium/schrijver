import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export const markdownHighlightStyle = HighlightStyle.define([
	{
		tag: tags.heading,
		color: 'var(--ink)',
		fontWeight: '700',
		textDecoration: 'none'
	},
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strong, fontWeight: '700' },
	{ tag: tags.strikethrough, textDecoration: 'line-through' },
	{
		tag: [tags.link, tags.url, tags.monospace],
		color: 'var(--accent-ink)'
	},
	{
		tag: [tags.processingInstruction, tags.atom, tags.contentSeparator],
		color: 'color-mix(in srgb, var(--muted) 55%, var(--page))',
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
		color: 'var(--ink)',
		fontSize: '0.82rem'
	},
	'&.cm-focused': {
		boxShadow: 'inset 0 -1px var(--accent)',
		outline: 'none'
	},
	'.cm-scroller': {
		overflow: 'auto',
		overscrollBehavior: 'contain',
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
		backgroundColor: 'var(--selection)'
	},
	'.cm-cursor': {
		borderLeft: '1px solid var(--accent)',
		borderLeftColor: 'var(--accent)'
	},
	'.cm-placeholder': {
		color: 'color-mix(in srgb, var(--muted) 65%, transparent)'
	}
});

export const writerTheme = EditorView.theme({
	'&': {
		height: '100%',
		minHeight: '100%',
		backgroundColor: 'transparent',
		color: 'var(--ink)'
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
		fontSize: '1.5em',
		lineHeight: '1.75',
		overscrollBehavior: 'contain',
		scrollPaddingBlock: 'clamp(2.5rem, 2rem + 1.5vw, 3.5rem)'
	},
	'.cm-content': {
		flex: '0 1 70ch',
		width: '100%',
		maxWidth: '70ch',
		minHeight: '100%',
		margin: '0 auto',
		padding: 'var(--editor-block-space) var(--editor-inline-space)',
		caretColor: 'var(--accent)',
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
		backgroundColor: 'var(--selection)'
	},
	'.cm-cursor': {
		borderLeftColor: 'var(--accent)'
	},
	'.cm-panels': {
		borderColor: 'var(--rule)',
		backgroundColor: 'var(--page)',
		color: 'var(--muted)',
		fontFamily:
			"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		fontSize: '0.9rem'
	},
	'.cm-panels-top': {
		zIndex: '10',
		borderBottom: '1px solid var(--rule)',
		boxShadow: '0 0.35rem 0.9rem rgba(34, 35, 31, 0.05)'
	},
	'.cm-panels-bottom': {
		borderTop: '1px solid var(--rule)'
	},
	'.cm-panel': {
		padding: 'var(--space-3xs) var(--space-xs)'
	},
	'.cm-panel.cm-search': {
		display: 'grid',
		gridTemplateColumns:
			'minmax(12rem, 1fr) repeat(4, 1.8rem) 0.65rem repeat(2, 1.8rem) 0.75rem 1.8rem',
		gridTemplateRows: '2rem 2rem',
		alignItems: 'center',
		columnGap: '0.2rem',
		rowGap: '0.25rem',
		padding:
			'0.375rem max(var(--space-2xs), calc((100vw - var(--shell-max)) / 2 + var(--space-2xs)))',
		backgroundColor: 'color-mix(in srgb, var(--page) 94%, var(--paper))',
		fontFamily:
			"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
		lineHeight: '1'
	},
	'.cm-panel.cm-search br': {
		display: 'none'
	},
	'.cm-panel.cm-search .cm-textfield, .cm-panel.cm-search .cm-button, .cm-panel.cm-search label': {
		margin: '0'
	},
	'.cm-panel.cm-search .cm-textfield': {
		width: '100%',
		height: '2rem',
		minWidth: '0',
		border: '1px solid var(--rule)',
		borderRadius: '3px',
		backgroundColor: 'color-mix(in srgb, var(--paper) 82%, var(--page))',
		color: 'var(--ink)',
		font: 'inherit',
		padding: '0 var(--space-2xs)'
	},
	'.cm-panel.cm-search .cm-textfield::placeholder': {
		color: 'color-mix(in srgb, var(--muted) 70%, transparent)'
	},
	'.cm-panel.cm-search .cm-textfield:focus': {
		borderColor: 'var(--accent)',
		outline: '1px solid var(--accent)',
		outlineOffset: '0'
	},
	'.cm-panel.cm-search .cm-textfield[name="search"]': {
		gridColumn: '1',
		gridRow: '1'
	},
	'.cm-panel.cm-search .cm-textfield[name="replace"]': {
		gridColumn: '1',
		gridRow: '2'
	},
	'.cm-panel.cm-search label': {
		position: 'relative',
		display: 'grid',
		width: '1.65rem',
		height: '1.65rem',
		placeItems: 'center',
		border: '1px solid transparent',
		borderRadius: '3px',
		color: 'var(--muted)',
		cursor: 'pointer',
		fontSize: '0',
		justifySelf: 'center',
		userSelect: 'none'
	},
	'.cm-panel.cm-search label:nth-of-type(1)': {
		gridColumn: '2',
		gridRow: '1'
	},
	'.cm-panel.cm-search label:nth-of-type(2)': {
		gridColumn: '4',
		gridRow: '1'
	},
	'.cm-panel.cm-search label:nth-of-type(3)': {
		gridColumn: '3',
		gridRow: '1'
	},
	'.cm-panel.cm-search label:hover': {
		borderColor: 'var(--rule)',
		backgroundColor: 'var(--paper)',
		color: 'var(--ink)'
	},
	'.cm-panel.cm-search label:has(input:checked)': {
		borderColor: 'color-mix(in srgb, var(--accent) 45%, var(--rule))',
		backgroundColor: 'color-mix(in srgb, var(--accent) 12%, var(--paper))',
		color: 'var(--accent-ink)'
	},
	'.cm-panel.cm-search label:has(input:focus-visible)': {
		outline: '2px solid var(--accent)',
		outlineOffset: '1px'
	},
	'.cm-panel.cm-search input[type="checkbox"]': {
		position: 'absolute',
		width: '1px',
		height: '1px',
		opacity: '0',
		pointerEvents: 'none'
	},
	'.cm-panel.cm-search .cm-button, .cm-panel.cm-search button[name="close"]': {
		appearance: 'none',
		display: 'grid',
		width: '1.65rem',
		height: '1.65rem',
		minHeight: '0',
		alignItems: 'center',
		justifyItems: 'center',
		padding: '0',
		border: '1px solid transparent',
		borderRadius: '3px',
		backgroundImage: 'none',
		backgroundColor: 'transparent',
		color: 'var(--muted)',
		cursor: 'pointer',
		fontSize: '0',
		justifySelf: 'center'
	},
	'.cm-panel.cm-search .cm-search-icon > .lucide-icon': {
		display: 'block',
		width: '0.94rem',
		height: '0.94rem',
		pointerEvents: 'none'
	},
	'.cm-panel.cm-search button[name="select"]': {
		gridColumn: '5',
		gridRow: '1'
	},
	'.cm-panel.cm-search button[name="prev"]': {
		gridColumn: '7',
		gridRow: '1'
	},
	'.cm-panel.cm-search button[name="next"]': {
		gridColumn: '8',
		gridRow: '1'
	},
	'.cm-panel.cm-search button[name="close"]': {
		position: 'static',
		gridColumn: '10',
		gridRow: '1'
	},
	'.cm-panel.cm-search button[name="replace"]': {
		gridColumn: '2',
		gridRow: '2'
	},
	'.cm-panel.cm-search button[name="replaceAll"]': {
		gridColumn: '3',
		gridRow: '2',
		width: '100%'
	},
	'.cm-panel.cm-search .cm-button:hover, .cm-panel.cm-search .cm-button:focus-visible, .cm-panel.cm-search button[name="close"]:hover, .cm-panel.cm-search button[name="close"]:focus-visible':
		{
			borderColor: 'var(--rule)',
			backgroundColor: 'var(--paper)',
			color: 'var(--accent-ink)'
		},
	'.cm-panel.cm-search .cm-button:focus-visible, .cm-panel.cm-search button[name="close"]:focus-visible':
		{
			outline: '2px solid var(--accent)',
			outlineOffset: '1px'
		},
	'.cm-panel.cm-search .cm-button[disabled]': {
		cursor: 'default',
		opacity: '0.35'
	},
	'@media (max-width: 48rem)': {
		'.cm-panel.cm-search': {
			gridTemplateColumns:
				'repeat(4, minmax(0, 1fr)) 0.5rem repeat(2, minmax(0, 1fr)) 0.5rem minmax(0, 1fr)',
			gridTemplateRows: '1.75rem 1.65rem 1.75rem',
			padding: 'var(--space-3xs) var(--space-2xs)'
		},
		'.cm-panel.cm-search .cm-textfield[name="search"]': {
			gridColumn: '1 / 10',
			gridRow: '1'
		},
		'.cm-panel.cm-search label:nth-of-type(1)': {
			gridColumn: '1',
			gridRow: '2'
		},
		'.cm-panel.cm-search label:nth-of-type(3)': {
			gridColumn: '2',
			gridRow: '2'
		},
		'.cm-panel.cm-search label:nth-of-type(2)': {
			gridColumn: '3',
			gridRow: '2'
		},
		'.cm-panel.cm-search button[name="select"]': {
			gridColumn: '4',
			gridRow: '2'
		},
		'.cm-panel.cm-search button[name="prev"]': {
			gridColumn: '6',
			gridRow: '2'
		},
		'.cm-panel.cm-search button[name="next"]': {
			gridColumn: '7',
			gridRow: '2'
		},
		'.cm-panel.cm-search button[name="close"]': {
			gridColumn: '9',
			gridRow: '2'
		},
		'.cm-panel.cm-search .cm-textfield[name="replace"]': {
			gridColumn: '1 / 7',
			gridRow: '3'
		},
		'.cm-panel.cm-search button[name="replace"]': {
			gridColumn: '7',
			gridRow: '3'
		},
		'.cm-panel.cm-search button[name="replaceAll"]': {
			gridColumn: '9',
			gridRow: '3'
		}
	},
	'.cm-searchMatch': {
		backgroundColor: 'color-mix(in srgb, var(--mark) 24%, transparent)'
	},
	'.cm-searchMatch.cm-searchMatch-selected': {
		backgroundColor: 'color-mix(in srgb, var(--mark) 36%, transparent)'
	},
	'.cm-tooltip-lint': {
		margin: '0',
		padding: '0.55rem 0.7rem',
		border: '1px solid color-mix(in srgb, var(--rule) 72%, var(--paper))',
		backgroundColor: 'color-mix(in srgb, var(--paper) 92%, var(--page))',
		boxShadow: '0 0.35rem 1rem rgba(34, 35, 31, 0.08)',
		color: 'var(--ink)',
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
		marginTop: 'var(--space-3xs)',
		paddingTop: 'var(--space-3xs)',
		borderTop: '1px solid color-mix(in srgb, var(--paper) 18%, transparent)'
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
		color: 'var(--muted)',
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
