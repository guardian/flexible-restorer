// Palette ported from public/sass (palette.scss, snapshot-list.scss). These are
// faithful legacy values with no exact @guardian/stand token equivalent, so they
// are kept local rather than mapped to Stand design tokens.
export const palette = {
	grey500: '#898984',
	grey400: '#BDBDBD',
	grey300: '#DCDCDC',
	grey650: '#333333',
	boxPrimary: '#ffffff',
	boxSecondary: '#F1F1F1',
	boxTertiary: '#dee2e3',
	active: '#00ADEE',
	secondaryBanner: '#ed5935',
	link: '#2ea3eb',
	thinBorder: 'rgba(162, 160, 160, 0.49)',
} as const;
