import type { FunctionComponent } from 'react';
import type { ListElement } from '../../models/snapshotContent';
// eslint-disable-next-line import/no-cycle -- elements render recursively, so the cycle is intentional
import { ArticleElementView } from './ArticleElementView';
import { RawHtml } from './RawHtml';

export type ListElementViewProps = {
	element: ListElement;
};

/**
 * Render a "list" element (Key takeaways, Q&A explainer, mini profiles).
 * Titles and bylines are plain text; biographies are HTML fragments. Nested
 * content uses the article renderer, followed by an emphasised end note.
 */
export const ListElementView: FunctionComponent<ListElementViewProps> = ({
	element,
}) => {
	return (
		<>
			{element.items.map((item, index) => (
				<div key={index}>
					{item.title && <h2>{item.title}</h2>}
					{item.byline && <p>{item.byline}</p>}
					{item.bio && <RawHtml html={item.bio} />}
					{item.content.map((child, childIndex) => (
						<ArticleElementView key={childIndex} element={child} />
					))}
					{item.endNote && (
						<p>
							<em>{item.endNote}</em>
						</p>
					)}
				</div>
			))}
		</>
	);
};
