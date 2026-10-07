import { css } from '@emotion/react';

export const appCss = css({ height: '100vh' });

export const globalStyles = css`
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
