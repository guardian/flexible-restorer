/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { css, Global } from '@emotion/react';
import { useGetSnapshotListQuery } from './store/restorerApi';
import { AppHeader } from './AppHeader';
import { SearchForm } from './SearchForm';
import { ContentViewer } from './content-viewer/ContentViewer';
import { ErrorModal } from './error-modal/ErrorModal';
import { RestoreModal } from './restore-modal/RestoreModal';
import { SnapshotSidebar } from './snapshot-sidebar/SnapshotSidebar';
import { trackRoute } from './utils/analytics';

type Route =
	| { name: 'splash' }
	| { name: 'versions'; contentId: string }
	| { name: 'not-found' };

const appCss = css({ height: '100vh' });
const splashCss = css({ height: '100%' });
const versionsCss = css({
	display: 'grid',
	gridTemplateColumns: 'minmax(240px, 33.333%) minmax(0, 1fr)',
	height: 'calc(100% - 40px)',
	overflow: 'hidden',
	'@media (max-width: 700px)': {
		gridTemplateColumns: 'minmax(180px, 40%) minmax(0, 1fr)',
	},
});
const loadingCss = css({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
	fontFamily: '"Guardian Egyptian Text"',
});

const globalStyles = css`
	@font-face {
		font-family: 'Guardian Agate Sans';
		src: url('/assets/fonts/GuardianAgateSans1Web-Regular.woff2') format('woff2'),
			url('/assets/fonts/GuardianAgateSans1Web-Regular.woff') format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Agate Sans';
		src: url('/assets/fonts/GuardianAgateSans1Web-Bold.woff2') format('woff2'),
			url('/assets/fonts/GuardianAgateSans1Web-Bold.woff') format('woff');
		font-weight: bold;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Egyptian Text';
		src: url('/assets/fonts/GuardianTextEgyptianWeb-Medium.woff2') format('woff2'),
			url('/assets/fonts/GuardianTextEgyptianWeb-Medium.woff') format('woff');
		font-weight: 500;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Guardian Egyptian Text';
		src: url('/assets/fonts/GuardianTextEgyptianWeb-Regular.woff2') format('woff2'),
			url('/assets/fonts/GuardianTextEgyptianWeb-Regular.woff') format('woff');
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

const VersionsView: FunctionComponent<{ contentId: string }> = ({
	contentId,
}) => {
	const { isLoading } = useGetSnapshotListQuery(contentId);

	return (
		<>
			<AppHeader />
			{isLoading ? (
				<div css={loadingCss} data-testid="snapshot-list-loading">
					Loading versions...
				</div>
			) : (
				<div css={versionsCss} data-testid="versions-view">
					<SnapshotSidebar contentId={contentId} />
					<ContentViewer contentId={contentId} />
					<RestoreModal contentId={contentId} />
				</div>
			)}
		</>
	);
};

const App: FunctionComponent = () => {
	const [route, setRoute] = useState<Route>(() => getRoute(window.location.pathname));

	useEffect(() => {
		const handlePopState = (): void => {
			setRoute(getRoute(window.location.pathname));
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	useEffect(() => {
		trackRoute(window.location.pathname);
	}, [route]);

	return (
		<div css={appCss}>
			<Global styles={globalStyles} />
			<ErrorModal />
			{route.name === 'splash' && (
				<div css={splashCss} data-testid="splash-view">
					<AppHeader />
					<SearchForm />
				</div>
			)}
			{route.name === 'versions' && (
				<VersionsView contentId={route.contentId} />
			)}
			{route.name === 'not-found' && (
				<div data-testid="not-found-view">Page not found</div>
			)}
		</div>
	);
};

export { App, getRoute };
export type { Route };
