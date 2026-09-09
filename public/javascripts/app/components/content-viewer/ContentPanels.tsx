/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import type { ArticleElement } from '../models/snapshotContent';
import { ArticleBody } from './article/ArticleBody';

const FONT_AGATE = '"Guardian Agate Sans"';

// Ported from snapshot-content.scss `.snapshot-content__container`: a 200%-wide
// track holding the HTML and JSON columns side by side, slid left to reveal the
// JSON column when active.
const container = (showJson: boolean) =>
	css({
		display: 'flex',
		width: '200%',
		flexGrow: 1,
		transition: 'transform .3s ease-in-out',
		transform: showJson ? 'translateX(-50%)' : 'translateX(0)',
	});

const htmlItem = css({
	boxSizing: 'border-box',
	width: '50%',
	padding: '2% 10%',
	fontFamily: FONT_AGATE,
	overflow: 'auto',
});

const jsonItem = css({
	boxSizing: 'border-box',
	width: '50%',
	padding: '2% 5%',
	fontFamily: FONT_AGATE,
	overflow: 'auto',
	'& code': {
		wordWrap: 'break-word',
	},
});

type ContentPanelsProps = {
	elements: ArticleElement[];
	json: string;
	isShowingJSON: boolean;
};

/** The sliding HTML / JSON columns for the current snapshot. */
const ContentPanels: FunctionComponent<ContentPanelsProps> = ({
	elements,
	json,
	isShowingJSON,
}) => (
	<div
		css={container(isShowingJSON)}
		data-testid="snapshot-content-container"
		data-show-json={isShowingJSON}
	>
		<div css={htmlItem}>
			<ArticleBody elements={elements} />
		</div>
		<div css={jsonItem}>
			<pre>
				<code>{json}</code>
			</pre>
		</div>
	</div>
);

export { ContentPanels };
export type { ContentPanelsProps };
