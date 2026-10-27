// Expose the article as typed elements so dedicated components can render text,
// lists and timelines without assembling a single HTML string for the body.

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
		blocks?: Array<{ elements?: RawElement[] }>;
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
 * Parse a raw snapshot into the renderableContent model, extracting preview fields,
 * flattening block elements and retaining the full snapshot
 * as pretty-printed JSON.
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
