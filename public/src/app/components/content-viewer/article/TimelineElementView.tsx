import type { FunctionComponent } from 'react';
import type { TimelineElement } from '../../models/snapshotContent';
// eslint-disable-next-line import/no-cycle -- elements render recursively, so the cycle is intentional
import { ArticleElementView } from './ArticleElementView';

export type TimelineElementViewProps = {
	element: TimelineElement;
};

/**
 * Render timeline sections with their titles and dated events.
 * Section titles, event headings and dates are plain text; event bodies are
 * nested article elements rendered through the shared article renderer.
 */
export const TimelineElementView: FunctionComponent<
	TimelineElementViewProps
> = ({ element }) => {
	return (
		<>
			{element.sections.map((section, sectionIndex) => (
				<div key={sectionIndex}>
					{section.title}
					{section.events.map((event, eventIndex) => (
						<div key={eventIndex}>
							{event.title && <h2>{event.title}</h2>}
							{event.date && <p>{event.date}</p>}
							{event.body.map((child, childIndex) => (
								<ArticleElementView
									key={childIndex}
									element={child}
								/>
							))}
						</div>
					))}
				</div>
			))}
		</>
	);
};
