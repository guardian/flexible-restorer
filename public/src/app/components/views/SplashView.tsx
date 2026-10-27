/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import type { FunctionComponent } from 'react';
import { AppHeader } from '../AppHeader';
import { SearchForm } from '../SearchForm';

const splashCss = css({ height: '100%' });

const SplashView: FunctionComponent = () => (
	<div css={splashCss} data-testid="splash-view">
		<AppHeader />
		<SearchForm />
	</div>
);

export { SplashView };
