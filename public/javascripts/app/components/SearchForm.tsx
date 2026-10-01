/** @jsxImportSource @emotion/react */
import type { FormEvent, FunctionComponent } from 'react';
import { useState } from 'react';
import { css } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { TextInput } from '@guardian/stand/TextInput';
import { useBrowserRouter } from './hooks/useBrowserRouter';

export type SearchFormProps = {
	/**
	 * Optional pre-filled query for embedding the form with an existing value.
	 */
	initialQuery?: string;
};

// Fill the column height and centre the label/input/button. No Stand theme
// covers this layout, so the styles live inline with Emotion.
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
 * Search form migrated from the legacy splash screen. Navigation uses browser
 * history so the form does not depend on a framework-specific router.
 */
export const SearchForm: FunctionComponent<SearchFormProps> = ({
	initialQuery = '',
}) => {
	const [query, setQuery] = useState(initialQuery);
	const { setUrl } = useBrowserRouter();

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

