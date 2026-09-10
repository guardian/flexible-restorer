/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { styles } from './styles';

import { baseTypography } from '@guardian/stand'; 

const textStyle = {
	fontFamily: baseTypography.family.openSans,
	fontSize: '12px',
};

type DeltaRowProps = {
	/** Humanised time between a snapshot and the next (older) one. */
	label: string;
};

/**
 * The faint "time between snapshots" row shown after each item. Migrated from
 * the `delta-row` markup of restore-list.html.
 */
const DeltaRow: FunctionComponent<DeltaRowProps> = ({ label }) => (
	<li css={styles.deltaRow}>
		<span css={[styles.deltaContent, textStyle]}>{label}</span>
		<span css={styles.deltaIcon} aria-hidden="true" />
	</li>
);

export { DeltaRow };
export type { DeltaRowProps };
