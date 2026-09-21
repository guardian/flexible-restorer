import { useEffect, useState } from 'react';

type BrowserRouter = {
	getUrl: () => string;
	setUrl: (path: string) => void;
};

const currentUrl = (): string =>
	`${window.location.pathname}${window.location.search}${window.location.hash}`;

const useBrowserRouter = (): BrowserRouter => {
	const [, setVersion] = useState(0);

	useEffect(() => {
		const handlePopState = (): void => setVersion((version) => version + 1);
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	return {
		getUrl: currentUrl,
		setUrl: (path: string): void => {
			window.history.pushState({}, '', path);
			window.dispatchEvent(new PopStateEvent('popstate'));
		},
	};
};

export { useBrowserRouter };
