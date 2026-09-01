// Ambient declaration for the app-wide `mediator-js` singleton exported from
// `mediator.js`. The React/TypeScript project type-checks `components/**` only
// with `allowJs: false`, so it cannot infer types from the plain-JS module; this
// declaration lets migrated components import the shared instance while staying
// strictly typed. It resolves ahead of `mediator.js` for `import` statements.
declare const mediator: {
	publish(channel: string, ...args: unknown[]): void;
	subscribe(channel: string, callback: (...args: unknown[]) => void): void;
	remove(channel: string, callback?: (...args: unknown[]) => void): void;
};

export default mediator;
