/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css, Global } from '@emotion/react';

// Stand does not provide a brand-only header strip, and its tokens do not
// exactly match these legacy colours, so preserve the existing design here.
const hostCss = css({
	'app-header': {
		flexShrink: 0,
	},
});

const headerCss = css({
	display: 'flex',
	height: '46px',
	backgroundColor: '#dee2e3',
	border: '1px solid #bdbdbd',
	borderTop: 0,
	boxSizing: 'border-box',
});

const logoCss = css({
	display: 'block',
	boxSizing: 'border-box',
	width: '50px',
	height: '45px',
	padding: '3px 6px 4px',
	backgroundColor: '#005689',
});

const AppHeader: FunctionComponent = () => (
	<>
		<Global styles={hostCss} />
		<header css={headerCss}>
			<img
				css={logoCss}
				src="/assets/images/restorer-white-38.svg"
				alt="Flexible Restorer"
			/>
		</header>
	</>
);

export { AppHeader };