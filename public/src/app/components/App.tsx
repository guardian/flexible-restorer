/** @jsxImportSource @emotion/react */
import { css, Global } from '@emotion/react';
import { useEffect } from 'react';
import type { FunctionComponent } from 'react';
import { ErrorModal } from './error-modal/ErrorModal';
import { useBrowserRouter } from './hooks/useBrowserRouter';
import { trackRoute } from './utils/analytics';
import { NotFoundView } from './views/NotFoundView';
import { SplashView } from './views/SplashView';
import { VersionsView } from './views/VersionsView';

type Route =
	| { name: 'splash' }
	| { name: 'versions'; contentId: string }
	| { name: 'not-found' };

const appCss = css({ height: '100vh' });

const globalStyles = css`
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

const getRoute = (pathname: string): Route => {
	if (pathname === '/') {
		return { name: 'splash' };
	}

	const match = pathname.match(/^\/content\/([^/]+)\/versions\/?$/);
	if (match?.[1]) {
		return { name: 'versions', contentId: decodeURIComponent(match[1]) };
	}

	return { name: 'not-found' };
};

const App: FunctionComponent = () => {
	const { getUrl } = useBrowserRouter();
	const pathname = new URL(getUrl(), window.location.origin).pathname;
	const route = getRoute(pathname);

	useEffect(() => {
		trackRoute(pathname);
	}, [pathname]);

	return (
		<div css={appCss}>
			<Global styles={globalStyles} />
			<ErrorModal />
			{route.name === 'splash' && <SplashView />}
			{route.name === 'versions' && (
				<VersionsView contentId={route.contentId} />
			)}
			{route.name === 'not-found' && <NotFoundView />}
		</div>
	);
};

export { App, getRoute };
export type { Route };
