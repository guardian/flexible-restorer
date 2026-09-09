import type { FunctionComponent } from 'react';
import type { ListElement } from '../../models/snapshotContent';
import { RawHtml } from './RawHtml';
import { ArticleElementView } from './ArticleElementView';

type ListElementViewProps = {
	element: ListElement;
};

/**
 * Render a "list" element (Key takeaways, Q&A explainer, mini profiles).
 *
 * Mirrors the legacy `getListItemContent` in SnapshotModel.js: title as an
 * `<h2>`, byline as a `<p>`, the raw `bio` HTML, the nested content elements,
 * then the `endNote` as emphasised text.
 */
const ListElementView: FunctionComponent<ListElementViewProps> = ({
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

export { ListElementView };
export type { ListElementViewProps };
