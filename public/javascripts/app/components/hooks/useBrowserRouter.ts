import { useEffect, useState } from 'react';

type BrowserRouter = {
	getUrl: () => string;
	setUrl: (path: string) => void;
};

const currentUrl = (): string =>
	`${window.location.pathname}${window.location.search}${window.location.hash}`;

const useBrowserRouter = (): BrowserRouter => {
	const [url, setUrlState] = useState(currentUrl);

	useEffect(() => {
		const handlePopState = (): void => setUrlState(currentUrl());
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	return {
		getUrl: () => url,
		setUrl: (path: string): void => {
			window.history.pushState({}, '', path);
			window.dispatchEvent(new PopStateEvent('popstate'));
		},
	};
};

export { useBrowserRouter };
