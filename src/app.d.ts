// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '*.mp3' {
	const src: string;
	export default src;
}

declare module '*.wav' {
	const src: string;
	export default src;
}

declare module '*.ogg' {
	const src: string;
	export default src;
}

export {};
