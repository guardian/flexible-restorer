// SVG imports use Vite's `?inline` query, which resolves them to a
// `data:image/svg+xml` URI string embedded directly in the bundle.
declare module '*.svg?inline' {
	const src: string;
	export default src;
}

// A plain `*.svg` import resolves to the (hashed) asset URL emitted by Vite.
declare module '*.svg' {
	const src: string;
	export default src;
}
