/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { palette } from '../styles/palette';

const FONT_AGATE = '"Guardian Agate Sans"';

// Ported from snapshot-content.scss: `.snapshot-content__furniture` (thin bottom
// rule) and `.snapshot-content__furniture__item` (padding + Agate typography).
const furniture = css({
	borderBottom: `1px solid ${palette.thinBorder}`,
});

const item = css({
	padding: '2%',
});

const header = css({
	fontFamily: FONT_AGATE,
	fontWeight: 'bold',
	color: palette.grey650,
	margin: 0,
});

const content = css({
	fontFamily: FONT_AGATE,
	fontWeight: 'normal',
	color: palette.grey650,
});

type ContentFurnitureProps = {
	headline: string | undefined;
	standfirst: string | undefined;
	trailText: string | undefined;
};

const Field: FunctionComponent<{ label: string; value: string | undefined }> = ({
	label,
	value,
}) => (
	<div css={item}>
		<h4 css={header}>{label}</h4>
		<p css={content}>{value}</p>
	</div>
);

/** The headline/standfirst/trailText summary shown above the article body. */
const ContentFurniture: FunctionComponent<ContentFurnitureProps> = ({
	headline,
	standfirst,
	trailText,
}) => (
	<div css={furniture} data-testid="snapshot-content-furniture">
		<Field label="Headline" value={headline} />
		<Field label="Standfirst" value={standfirst} />
		<Field label="TrailText" value={trailText} />
	</div>
);

export { ContentFurniture };
export type { ContentFurnitureProps };
