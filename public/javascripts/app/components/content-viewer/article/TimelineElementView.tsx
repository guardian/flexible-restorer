import type { FunctionComponent } from 'react';
import type { TimelineElement } from '../../models/snapshotContent';
import { ArticleElementView } from './ArticleElementView';

type TimelineElementViewProps = {
	element: TimelineElement;
};

/**
 * Render a "timeline" element.
 *
 * Mirrors the legacy `getTimelineEventContent` in SnapshotModel.js: each section
 * shows its (plain-text) title followed by its events, where an event renders
 * its title as an `<h2>`, its date as a `<p>`, then the nested body elements.
 */
const TimelineElementView: FunctionComponent<TimelineElementViewProps> = ({
	element,
}) => {
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

export { TimelineElementView };
export type { TimelineElementViewProps };
