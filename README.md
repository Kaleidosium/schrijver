# schrijver

schrijver is a distraction-free Markdown editor for manuscripts and long-form prose. It combines plain-text editing with margin notes, parts-of-speech highlighting, style checks, and local crash recovery.

## Features

- **Typography.** Paper-toned theme with proportional and monospace fonts, reader mode, and clean headings.
- **Focus modes.** Sentence and paragraph isolation dim the rest of the text while you write.
- **Hemingway mode.** Disables backspace and deletion to stop second-guessing during drafts.
- **Syntax and style checks.** Highlights parts of speech like adjectives, verbs, and nouns, along with wordy phrases, passive voice, and clichés.
- **Writer notes.** Anchored margin annotations and manuscript-level notes saved in `.schrijver.json` sidecar files alongside Markdown files.
- **Local persistence.** Crash recovery and multi-tab synchronization backed by local storage.
- **File system access.** Open and save folders directly in supported browsers, or download files as a fallback.

## Development

This project runs on [Vite+](https://viteplus.dev), using the `vp` CLI for package management, checks, and builds.

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

## License

This project is licensed under the [Apache License 2.0](LICENSE)
