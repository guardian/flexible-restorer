import type { FunctionComponent } from 'react';
import type { ArticleElement } from '../../models/snapshotContent';
import { ArticleElementView } from './ArticleElementView';

export type ArticleBodyProps = {
	elements: ArticleElement[];
};

/**
 * Render a snapshot's article body from its flattened list of elements.
 */
export const ArticleBody: FunctionComponent<ArticleBodyProps> = ({
	elements,
}) => {
	return (
		<>
			{elements.map((element, index) => (
				<ArticleElementView key={index} element={element} />
			))}
		</>
	);
};
