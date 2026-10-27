import type { FunctionComponent } from 'react';
import type { ArticleElement } from '../../models/snapshotContent';
// eslint-disable-next-line import/no-cycle -- elements render recursively, so the cycle is intentional
import { ListElementView } from './ListElementView';
import { RawHtml } from './RawHtml';
// eslint-disable-next-line import/no-cycle -- elements render recursively, so the cycle is intentional
import { TimelineElementView } from './TimelineElementView';

export type ArticleElementViewProps = {
	element: ArticleElement;
};

/** Render a single article element by dispatching on its kind. */
export const ArticleElementView: FunctionComponent<ArticleElementViewProps> = ({
	element,
}) => {
	switch (element.kind) {
		case 'html':
			return <RawHtml html={element.html} />;
		case 'list':
			return <ListElementView element={element} />;
		case 'timeline':
			return <TimelineElementView element={element} />;
	}
};
