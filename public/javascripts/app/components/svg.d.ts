// SVG imports are handled by webpack's `asset/inline` loader (see
// webpack.config.js), which resolves them to a `data:image/svg+xml` URI string.
declare module '*.svg' {
	const src: string;
	export default src;
}
