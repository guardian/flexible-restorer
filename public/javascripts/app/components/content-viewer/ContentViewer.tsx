/** @jsxImportSource @emotion/react */
import type { FunctionComponent } from 'react';
import { css } from '@emotion/react';
import { useSnapshotContent } from '../hooks/useSnapshotContent';
import { ContentActions } from './ContentActions';
import { ContentFurniture } from './ContentFurniture';
import { ContentPanels } from './ContentPanels';

const FONT_EGYPTIAN = '"Guardian Egyptian Text"';

// Content root with an opacity fade on load and Egyptian body typography.
const root = (isSettingContent: boolean) =>
	css({
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		overflow: 'hidden',
		opacity: isSettingContent ? 0 : 1,
		transition: 'opacity .1s ease-in-out',
		fontFamily: FONT_EGYPTIAN,
		fontWeight: 'normal',
		fontSize: '16px',
		lineHeight: 1.5,
	});

// `.snapshot-content__viewport` + `.scrollable__container`.
const viewport = css({
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
	maxHeight: 'calc(100vh - 46px)',
	overflow: 'auto',
});

// `.scrollable__body`.
const body = css({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	overflowY: 'auto',
});

export type ContentViewerProps = {
	/** Content id parsed from the application route. */
	contentId: string;
};

/**
 * Snapshot content viewer: the article furniture, body (HTML/JSON) and the
 * restore/copy/export/toggle actions.
 *
 * Migrated from the `snapshot-content` block of restore-list.html and the
 * `SnapshotContentCtrl` controller. The active selection is shared through
 * the Redux viewer slice.
 */
export const ContentViewer: FunctionComponent<ContentViewerProps> = ({
	contentId,
}) => {
	const {
		content,
		isShowingJSON,
		isSettingContent,
		copyLabel,
		canRestore,
		toggleJson,
		restore,
		copyJson,
	} = useSnapshotContent(contentId);

	return (
		<div css={root(isSettingContent)}>
			<div css={viewport} data-testid="snapshot-content-viewport">
			{/* Hold the panel blank until content arrives, so the empty
			   furniture/labels never render mid-fetch. */}
			{content && (
				<>
				<ContentActions
					contentId={contentId}
					canRestore={canRestore}
					copyLabel={copyLabel}
					toggleLabel={isShowingJSON ? 'Show TEXT' : 'Show JSON'}
					onRestore={restore}
					onCopy={copyJson}
					onToggle={toggleJson}
				/>
				<div css={body}>
					<ContentFurniture
						headline={content.headline}
						standfirst={content.standfirst}
						trailText={content.trailText}
					/>
					<ContentPanels
						elements={content.elements}
						json={content.json}
						isShowingJSON={isShowingJSON}
					/>
				</div>
				</>
			)}
			</div>
		</div>
	);
};

