# schrijver

schrijver is a distraction-free Markdown text editor designed for manuscripts and long-form writing. It pairs plain-text simplicity with editorial tools, margin notes, syntax highlighting, and local recovery.

## Features

- **Typography-first editing**: Custom paper-toned theme with proportional and monospace type, balanced headings, and reader mode.
- **Focus modes**: Sentence and paragraph isolation dim the rest of the text so you can focus on the current line.
- **Hemingway mode**: Disables backspace and deletion so you keep moving forward.
- **Syntax and style analysis**: Highlights parts of speech (adjectives, nouns, adverbs, verbs, conjunctions) and stylistic patterns (weasel words, passive voice, wordy phrases, clichés).
- **Writer's notes**: Anchored margin annotations and manuscript-level notes saved in `.schrijver.json` sidecar files alongside standard Markdown files.
- **Local persistence**: Automatic crash recovery and multi-tab sync using local storage.
- **File system access**: Open and save local folders directly in supported browsers, with automatic fallback downloads.

## Development

This project uses [Vite+](https://viteplus.dev), which unifies the toolchain through the `vp` CLI.

### Install dependencies

```sh
vp install
```

### Start development server

```sh
vp dev
```

### Run quality checks and tests

```sh
vp check
vp test
```

### Build for production

```sh
vp build
```
