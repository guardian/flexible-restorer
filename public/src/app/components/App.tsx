/** @jsxImportSource @emotion/react */
import { Global } from '@emotion/react';
import { useEffect } from 'react';
import type { FunctionComponent } from 'react';
import { ErrorModal } from './error-modal/ErrorModal';
import { useBrowserRouter } from './hooks/useBrowserRouter';
import { appCss, globalStyles } from './styles/globalStyles';
import { trackRoute } from './utils/analytics';
import { NotFoundView } from './views/NotFoundView';
import { SplashView } from './views/SplashView';
import { VersionsView } from './views/VersionsView';

type Route =
	| { name: 'splash' }
	| { name: 'versions'; contentId: string }
	| { name: 'not-found' };

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
