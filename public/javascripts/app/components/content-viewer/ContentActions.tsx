/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { Button } from '@guardian/stand/Button';
import { LinkButton } from '@guardian/stand/LinkButton';
import { icons } from '../styles/icons';
import { palette } from '../styles/palette';

// Ported from snapshot-content.scss `.snapshot-content__actions`: a fixed action
// bar aligned to the right with a thin bottom rule.
const actions = css({
	display: 'flex',
	gap: '1rem',
	padding: '2% 5%',
	justifyContent: 'flex-end',
	flexShrink: 0,
	borderBottom: `1px solid ${palette.thinBorder}`,
});

const restoreIcon = css({
	marginRight: '5px',
});

type ContentActionsProps = {
	contentId: string;
	canRestore: boolean;
	copyLabel: string;
	toggleLabel: string;
	onRestore: () => void;
	onCopy: () => void;
	onToggle: () => void;
};

/** The Restore / Copy / Export / HTML-JSON-toggle actions bar. */
const ContentActions: FunctionComponent<ContentActionsProps> = ({
	contentId,
	canRestore,
	copyLabel,
	toggleLabel,
	onRestore,
	onCopy,
	onToggle,
}) => (
	<div css={actions} data-testid="snapshot-content-actions">
		{canRestore && (
			<Button variant="secondary" size="sm" onPress={onRestore}>
				<img css={restoreIcon} src={icons.wrenchDisabled} alt="" />
				Restore
			</Button>
		)}
		<Button
			variant="secondary"
			size="sm"
			onPress={onCopy}
			data-testid="snapshot-content-copy"
		>
			{copyLabel}
		</Button>
		<LinkButton
			variant="secondary"
			size="sm"
			href={`/export/${contentId}/git`}
			target="_blank"
		>
			Export all as Git Repo
		</LinkButton>
		<LinkButton
			variant="secondary"
			size="sm"
			href={`/export/${contentId}/zip`}
			target="_blank"
		>
			Export all as Zip
		</LinkButton>
		<Button
			variant="secondary"
			size="sm"
			onPress={onToggle}
			data-testid="snapshot-content-toggle"
		>
			{toggleLabel}
		</Button>
	</div>
);

export { ContentActions };
export type { ContentActionsProps };
