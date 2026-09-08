/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { palette } from '../styles/palette';

import { baseTypography } from '@guardian/stand'; 

const textStyle = {
	fontFamily: baseTypography.family.openSans,
	fontSize: '12px',
};

// --- delta row (from snapshot-list.scss) ---
const deltaRow = css({
	display: 'flex',
	flexDirection: 'row-reverse',
	alignItems: 'center',
	padding: '5px 0 2px 0',
	opacity: 0.3,
});

const deltaIcon = css({
	marginLeft: '5px',
	width: 0,
	height: 0,
	borderLeft: '4px solid transparent',
	borderRight: '4px solid transparent',
	borderTop: `5px solid ${palette.grey500}`,
});

const deltaContent = css({
	transition: 'opacity .2s ease-in-out',
	lineHeight: 1.4,
	fontSize: '12px',
});

type DeltaRowProps = {
	/** Humanised time between a snapshot and the next (older) one. */
	label: string;
};

/**
 * The faint "time between snapshots" row shown after each item. Migrated from
 * the `delta-row` markup of restore-list.html.
 */
const DeltaRow: FunctionComponent<DeltaRowProps> = ({ label }) => (
	<li css={deltaRow}>
		<span css={[deltaContent, textStyle]}>{label}</span>
		<span css={deltaIcon} aria-hidden="true" />
	</li>
);

export { DeltaRow };
export type { DeltaRowProps };
