/** @jsxImportSource @emotion/react */
import type { FormEvent, FunctionComponent } from 'react';
import { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { TextInput } from '@guardian/stand/TextInput';
import { useAngularRouter } from './hooks/useAngularRouter';

type SearchFormProps = {
	/**
	 * Optional pre-filled query. Supplied as the sole react2angular binding so
	 * the bridged component mounts (see ./index.js).
	 */
	initialQuery?: string;
};

// Migrated from the `.splash-screen__container__form center` SCSS: fill the
// column height and centre the label/input/button. No Stand theme covers this
// layout, so per the migration RFC the styles live inline with emotion.
const formCss = css({
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
	gap: '8px',
});

/**
 * Splash-screen search form.
 *
 * Migrated from the AngularJS `SearchFormCtrl` + inline template. Navigation is
 * performed through the `useAngularRouter` hook, which reaches the statically
 * provisioned `$location`/`$rootScope` services, so no Angular services are
 * passed in as props.
 */
const SearchForm: FunctionComponent<SearchFormProps> = ({
	initialQuery = '',
}) => {
	const [query, setQuery] = useState(initialQuery);
	const { setUrl } = useAngularRouter();

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		// Preserve the original behaviour: take the final path segment of the
		// entered Composer url (or a bare content id) and route to its versions.
		const hash = query.split('/').slice(-1)[0] ?? '';
		setUrl(`/content/${hash}/versions`);
	};

	return (
		<form noValidate name="search" css={formCss} onSubmit={handleSubmit}>
			<TextInput
				label="Enter a composer url:"
				type="text"
				isRequired
				value={query}
				onChange={setQuery}
			/>
			<Button type="submit" size="sm" isDisabled={!query}>
				Search
			</Button>
		</form>
	);
};

export { SearchForm };
export type { SearchFormProps };
