/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { formatCreatedDate, relativeDate } from '../utils/dateFormat';
import type { SnapshotIdViewModel } from '../models/snapshotId';
import { palette } from '../styles/palette';
import { icons } from '../styles/icons';

const item = (isActive: boolean, isLaunch = false) =>
	css({
		position: 'relative',
		overflow: isActive ? 'visible' : 'hidden',
		minHeight: '60px',
		display: 'flex',
		flexDirection: 'row',
		background: isActive ? palette.boxTertiary : palette.boxPrimary,
		// Launch snapshots gain a 2px border to stand out (text.scss
		// .highlight-row-for-launches).
		border: isLaunch ? `2px solid ${palette.grey500}` : undefined,
		transition: 'background-color .2s ease-in-out',
		// Hover overlay (only when not active). Content sits at z-index 2 above it.
		'&::before': {
			content: '" "',
			display: isActive ? 'none' : 'inline-block',
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			background: palette.grey500,
			opacity: 0,
			transition: 'transform .2s ease-in-out, opacity .2s ease-in',
			zIndex: 1,
		},
		'&:hover': isActive
			? undefined
			: {
					color: 'white',
					'&::before': { opacity: 1 },
				},
	});

const itemIndex = (isActive: boolean) =>
	css({
		boxSizing: 'border-box',
		flexBasis: '46px',
		maxWidth: '46px',
		padding: '5px',
		paddingTop: '10px',
		textAlign: 'center',
		fontFamily: '"Guardian Agate Sans"',
		fontWeight: 'normal',
		fontSize: '13px',
		marginBottom: 0,
		position: 'relative',
		zIndex: 2,
		borderRight: `2px solid ${palette.grey400}`,
		'&::before': isActive
			? {
					content: '" "',
					display: 'inline-block',
					position: 'absolute',
					top: 0,
					left: '-5px',
					width: '5px',
					height: '100%',
					backgroundColor: palette.active,
				}
			: undefined,
	});

const itemContent = css({
	padding: '10px 15px',
	flexBasis: '165px',
	fontWeight: 500,
	zIndex: 2,
	borderRight: `1px solid ${palette.grey400}`,
	cursor: 'pointer',
	h6: { margin: 0 },
});

// Individual h6 rows inside the item content. Fonts ported from text.scss; the
// zero margin is inherited from itemContent's `h6` rule and kept explicit here.
const itemActualDate = css({
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'bold',
	fontSize: '16px',
	margin: 0,
});

const itemRelativeDate = css({
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'normal',
	fontSize: '13px',
	margin: 0,
});

const itemReason = css({
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'normal',
	fontSize: '13px',
	margin: 0,
});

// Launch reasons are rendered bold + larger (text.scss
// .highlight-reason-for-launches).
const highlightLaunch = css({ fontWeight: 'bold', fontSize: '15px' });

const itemInformation = css({
	display: 'flex',
	justifyContent: 'flex-end',
	flexGrow: 3,
});

const itemStatus = (isLaunch = false) =>
	css({
		flexGrow: 3,
		fontSize: 'small',
		fontFamily: '"Guardian Agate Sans"',
		zIndex: 2,
		cursor: 'pointer',
		// Launch snapshots show a faded rocket in the top-right of the row,
		// positioned against the relatively-positioned item (text.scss
		// .highlight-row-for-launches .snapshot-list__item__status::after).
		'&::after': isLaunch
			? {
					content: '"\uD83D\uDE80"',
					display: 'block',
					position: 'absolute',
					top: '5px',
					right: '5px',
					fontSize: '150%',
					opacity: 0.6,
					filter: 'grayscale(100%)',
				}
			: undefined,
	});

const statusLeft = css({
	float: 'left',
	height: '3.1em',
	padding: '10px 5px',
});

const statusRight = css({
	float: 'right',
	width: '45%',
	height: '3.1em',
	padding: '10px 5px',
	borderLeft: `1px solid ${palette.grey400}`,
});

const legallySensitive = css({
	padding: 0,
	textAlign: 'center',
	height: '15px',
	marginBottom: '5px',
	width: '17px',
	background: `url(${icons.legallySensitive}) center center no-repeat`,
});

const commentsOn = css({ width: '32px' });
const commentsOff = css({ width: '36px' });

const commentsImage = (on: boolean) =>
	css({
		padding: 0,
		float: 'left',
		textAlign: 'center',
		height: '15px',
		width: '16px',
		background: `url(${on ? icons.commentsOn : icons.commentsOff}) center center no-repeat`,
	});

const commentsText = css({
	float: 'right',
	fontSize: '12px',
	textTransform: 'uppercase',
});

type SnapshotListItemProps = {
	snapshot: SnapshotIdViewModel;
	/** Fallback revision number: total list length minus the item's index. */
	fallbackRevision: number;
	isActive: boolean;
	onSelect: () => void;
};

/**
 * A single snapshot row: revision index, snapped/modified dates + reason, and the
 * status column (legally-sensitive / comments / published state). Migrated from
 * the `snapshot-list__item` markup of restore-list.html.
 */
const SnapshotListItem: FunctionComponent<SnapshotListItemProps> = ({
	snapshot,
	fallbackRevision,
	isActive,
	onSelect,
}) => {
	const { comments } = snapshot;
	const showCommentsOff = comments.defined !== undefined && !comments.on;
	const createdDate = formatCreatedDate(snapshot.createdDate);

	return (
		<li
			data-testid="snapshot-list-item"
			data-active={isActive}
			data-launch={snapshot.becauseOfLaunch}
			css={item(isActive, snapshot.becauseOfLaunch)}
		>
			<div css={itemIndex(isActive)}>
				{snapshot.revisionId ?? fallbackRevision}
			</div>

			<div css={itemContent} onClick={onSelect}>
				<h6 css={itemActualDate}>
					{createdDate.prefix}
					<sup>{createdDate.ordinal}</sup> {createdDate.month}
				</h6>
				<h6 css={itemRelativeDate}>
					{relativeDate(snapshot.createdDate)} ago
				</h6>
				<h6 css={itemReason}>
					Last modified by: {snapshot.userEmail}
				</h6>
				<h6
					css={[
						itemReason,
						snapshot.becauseOfLaunch && highlightLaunch,
					]}
				>
					{snapshot.snapshotReason}
				</h6>
			</div>

			<div css={itemInformation}>
				<div
					css={itemStatus(snapshot.becauseOfLaunch)}
					onClick={onSelect}
				>
					<div css={statusLeft}>
						{snapshot.legallySensitive && (
							<div
								data-testid="legally-sensitive"
								css={legallySensitive}
							/>
						)}

						{comments.on && (
							<div css={commentsOn}>
								<div css={commentsImage(true)} />
								<div css={commentsText}>on</div>
							</div>
						)}

						{showCommentsOff && (
							<div css={commentsOff}>
								<div css={commentsImage(false)} />
								<div css={commentsText}>off</div>
							</div>
						)}
					</div>

					{snapshot.publishedState && (
						<div css={statusRight}>{snapshot.publishedState}</div>
					)}
				</div>
			</div>
		</li>
	);
};

export { SnapshotListItem };
export type { SnapshotListItemProps };
