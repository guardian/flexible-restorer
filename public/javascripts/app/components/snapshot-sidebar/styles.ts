import { css } from '@emotion/react';
// Icons are imported so webpack's `asset/inline` loader embeds them as
// `data:image/svg+xml` URIs (matching the previous inlined-icon behaviour).
import legallySensitiveIcon from '../../../../images/legalcheck-grey-14.svg';
import commentsOnIcon from '../../../../images/comment-green-14.svg';
import commentsOffIcon from '../../../../images/comment-grey-14.svg';

// Palette ported from public/sass (palette.scss, snapshot-list.scss).
const palette = {
	grey500: '#898984',
	grey400: '#BDBDBD',
	grey300: '#DCDCDC',
	boxPrimary: '#ffffff',
	boxSecondary: '#F1F1F1',
	boxTertiary: '#dee2e3',
	active: '#00ADEE',
	secondaryBanner: '#ed5935',
	link: '#2ea3eb',
} as const;

const icons = {
	legallySensitive: legallySensitiveIcon,
	commentsOn: commentsOnIcon,
	commentsOff: commentsOffIcon,
} as const;

// --- sidebar shell (from sidebar.scss + box.scss "secondary" + scrollable.scss) ---
const sidebar = (isActive: boolean) =>
	css({
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		padding: '10px',
		backgroundColor: palette.boxSecondary,
		borderRight: `1px solid ${palette.grey300}`,
		overflow: 'auto',
		maxHeight: '100%',
		height: '100%',
		transform: isActive
			? 'translateX(0)'
			: 'translateZ(0) translateX(-110%)',
		transition: 'transform 1s',
		transitionDelay: '.3s',
	});

const scrollableContainer = css({
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '100%',
});

const headerFixed = css({ flexShrink: 0 });

const scrollableBody = css({ flexGrow: 1, overflowY: 'auto' });

// --- article header (from text.scss) ---
const articleHeadline = css({
	fontFamily: '"Guardian Egyptian Text"',
	fontWeight: 'bold',
	fontSize: '18px',
	lineHeight: '23px',
	marginBottom: 0,
});

const articleHash = css({
	marginBottom: '20px',
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'normal',
	fontSize: '13px',
	lineHeight: '18px',
	a: {
		textDecoration: 'none',
		color: palette.link,
	},
});

// --- list header row (from snapshot-list.scss) ---
const listHeader = css({
	display: 'flex',
	flexDirection: 'row',
	background: palette.boxTertiary,
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'bold',
	fontSize: '12px',
	textTransform: 'uppercase',
});

const listHeaderDecal = css({
	boxSizing: 'border-box',
	flexBasis: '46px',
	maxWidth: '46px',
	padding: '5px 10px',
	borderRight: `1px solid ${palette.grey400}`,
});

const listHeaderContent = css({
	padding: '5px 10px',
	flexBasis: '175px',
	borderRight: `1px solid ${palette.grey400}`,
});

const listHeaderStatus = css({ padding: '5px 10px' });

// --- list (from index-list mixins + snapshot-list.scss) ---
const list = css({
	marginTop: '5px',
	paddingLeft: 0,
	li: { listStyle: 'none' },
});

const secondaryBanner = css({
	color: 'white',
	background: palette.secondaryBanner,
	padding: '2px',
	fontFamily: '"Guardian Agate Sans"',
	fontWeight: 'bold',
	fontSize: '12px',
	textTransform: 'uppercase',
});

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

export const styles = {
	sidebar,
	scrollableContainer,
	headerFixed,
	scrollableBody,
	articleHeadline,
	articleHash,
	listHeader,
	listHeaderDecal,
	listHeaderContent,
	listHeaderStatus,
	list,
	secondaryBanner,
	item,
	itemIndex,
	itemContent,
	itemActualDate,
	itemRelativeDate,
	itemReason,
	highlightLaunch,
	itemInformation,
	itemStatus,
	statusLeft,
	statusRight,
	legallySensitive,
	commentsOn,
	commentsOff,
	commentsImage,
	commentsText,
	deltaRow,
	deltaIcon,
	deltaContent,
};
