import parse from 'html-react-parser';
import type { FunctionComponent, ReactNode } from 'react';

export type RawHtmlProps = {
	html: string;
};

/**
 * Render an author-supplied HTML fragment (from Composer) as real React nodes.
 *
 * Parsing converts markup to React elements; it does not sanitize the HTML.
 */
export const RawHtml: FunctionComponent<RawHtmlProps> = ({ html }) => {
	return <>{parse(html) as ReactNode}</>;
};
