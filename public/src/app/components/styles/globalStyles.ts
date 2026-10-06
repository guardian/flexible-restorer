import { css } from '@emotion/react';

export const appCss = css({ height: '100vh' });

export const globalStyles = css`
	@font-face {
		font-family: 'Guardian Agate Sans';
		src:
			url('/assets/fonts/GuardianAgateSans1Web-Regular.woff2')
				format('woff2'),
			url('/assets/fonts/GuardianAgateSans1Web-Regular.woff')
				format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Agate Sans';
		src:
			url('/assets/fonts/GuardianAgateSans1Web-Bold.woff2')
				format('woff2'),
			url('/assets/fonts/GuardianAgateSans1Web-Bold.woff') format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Egyptian Text';
		src:
			url('/assets/fonts/GuardianTextEgyptianWeb-Medium.woff2')
				format('woff2'),
			url('/assets/fonts/GuardianTextEgyptianWeb-Medium.woff')
				format('woff');
		font-weight: 500;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Egyptian Text';
		src:
			url('/assets/fonts/GuardianTextEgyptianWeb-Regular.woff2')
				format('woff2'),
			url('/assets/fonts/GuardianTextEgyptianWeb-Regular.woff')
				format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	html,
	body,
	#app,
	.main,
	.container {
		height: 100vh;
		margin: 0;
	}

	.main {
		display: flex;
		flex-direction: column;
	}

	.composer-icon object {
		max-width: 20px;
	}

	h6,
	h4 {
		margin: 0;
	}

	.hidden {
		display: none !important;
	}

	.full-width {
		width: 100%;
	}

	.no-shrink {
		flex-shrink: 0;
	}
`;
