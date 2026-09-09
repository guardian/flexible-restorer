import type { FunctionComponent, ReactNode } from 'react';
import parse from 'html-react-parser';

type RawHtmlProps = {
	html: string;
};

/**
 * Render an author-supplied HTML fragment (from Composer) as real React nodes.
 *
 * This replaces the legacy `ng-bind-html` / `$sce.trustAsHtml` path. Parsing to
 * React elements (rather than `dangerouslySetInnerHTML`) means React never runs
 * inline `on*` handlers or `<script>` tags, so it is a safer rendering of the
 * server-owned snapshot HTML.
 */
const RawHtml: FunctionComponent<RawHtmlProps> = ({ html }) => {
	return <>{parse(html) as ReactNode}</>;
};

export { RawHtml };
export type { RawHtmlProps };
