// Typed model for a single snapshot's renderable content, ported from the
// AngularJS `SnapshotModel` (models/SnapshotModel.js). The legacy model built a
// single HTML string via `getHTMLContent`; here we instead expose the article as
// a flat list of typed elements so the React `article/*` components can render
// them without `dangerouslySetInnerHTML`.

/** A leaf element holding a raw HTML/text fragment authored in Composer. */
type TextElement = { kind: 'html'; html: string };

/** A "list" element (Key takeaways, Q&A, Mini profiles). */
type ListElement = { kind: 'list'; items: ListItem[] };

type ListItem = {
	title: string | undefined;
	byline: string | undefined;
	bio: string | undefined;
	endNote: string | undefined;
	content: ArticleElement[];
};

/** A "timeline" element, grouped into titled sections of dated events. */
type TimelineElement = { kind: 'timeline'; sections: TimelineSection[] };

type TimelineSection = {
	title: string | undefined;
	events: TimelineEvent[];
};

type TimelineEvent = {
	title: string | undefined;
	date: string | undefined;
	body: ArticleElement[];
};

type ArticleElement = TextElement | ListElement | TimelineElement;

/** The parsed, ready-to-render view of a snapshot. */
type SnapshotContent = {
	headline: string | undefined;
	standfirst: string | undefined;
	trailText: string | undefined;
	elements: ArticleElement[];
	json: string;
};

// --- raw API shapes (defensive; only the fields we read are modelled) ---------

type RawElement = {
	fields?: {
		text?: string;
		html?: string;
		items?: RawListItem[];
		sections?: RawTimelineSection[];
	};
};

type RawListItem = {
	title?: string;
	byline?: string;
	bio?: string;
	endNote?: string;
	content?: RawElement[];
};

type RawTimelineSection = {
	title?: string;
	events?: RawTimelineEvent[];
};

type RawTimelineEvent = {
	title?: string;
	date?: string;
	body?: RawElement[];
};

type RawSnapshot = {
	preview?: {
		fields?: {
			headline?: string;
			standfirst?: string;
			trailText?: string;
		};
		blocks?: { elements?: RawElement[] }[];
	};
};

/** Convert a single raw element into a typed `ArticleElement`, or `undefined`. */
const toElement = (raw: RawElement): ArticleElement | undefined => {
	const fields = raw.fields;
	if (!fields) {
		return undefined;
	}

	if (typeof fields.text === 'string') {
		return { kind: 'html', html: fields.text };
	}
	if (typeof fields.html === 'string') {
		return { kind: 'html', html: fields.html };
	}
	if (fields.items) {
		return {
			kind: 'list',
			items: fields.items.map((item) => ({
				title: item.title,
				byline: item.byline,
				bio: item.bio,
				endNote: item.endNote,
				content: toElements(item.content ?? []),
			})),
		};
	}
	if (fields.sections) {
		return {
			kind: 'timeline',
			sections: fields.sections.map((section) => ({
				title: section.title,
				events: (section.events ?? []).map((event) => ({
					title: event.title,
					date: event.date,
					body: toElements(event.body ?? []),
				})),
			})),
		};
	}

	return undefined;
};

const toElements = (raw: RawElement[]): ArticleElement[] =>
	raw
		.map(toElement)
		.filter((element): element is ArticleElement => element !== undefined);

/**
 * Parse a raw snapshot into the renderable content model, mirroring the
 * derivations of the legacy `SnapshotModel` (headline/standfirst/trailText from
 * `preview.fields`, the flattened block elements, and the pretty-printed JSON).
 */
const parseSnapshotContent = (raw: RawSnapshot): SnapshotContent => {
	const preview = raw.preview;
	const blocks = preview?.blocks ?? [];
	const elements = toElements(
		blocks.flatMap((block) => block.elements ?? []),
	);

	return {
		headline: preview?.fields?.headline,
		standfirst: preview?.fields?.standfirst,
		trailText: preview?.fields?.trailText,
		elements,
		json: JSON.stringify(raw, null, 2),
	};
};

export { parseSnapshotContent };
export type {
	SnapshotContent,
	ArticleElement,
	TextElement,
	ListElement,
	ListItem,
	TimelineElement,
	TimelineSection,
	TimelineEvent,
	RawSnapshot,
};
