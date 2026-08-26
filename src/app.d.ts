/// <reference types="svelte" />
/// <reference types="svelte/elements" />

declare global {
	namespace svelteHTML {
		// Fallback for IDE language servers
		interface HTMLAttributes<T extends EventTarget = any> {}
		interface SVGAttributes<T extends EventTarget = any> {}
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
