import type { FunctionComponent } from 'react';
import type { ArticleElement } from '../../models/snapshotContent';
import { RawHtml } from './RawHtml';
import { ListElementView } from './ListElementView';
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

