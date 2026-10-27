/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import type { FunctionComponent } from 'react';
import { AppHeader } from '../AppHeader';
import { ContentViewer } from '../content-viewer/ContentViewer';
import { RestoreModal } from '../restore-modal/RestoreModal';
import { SnapshotSidebar } from '../snapshot-sidebar/SnapshotSidebar';
import { useGetSnapshotListQuery } from '../store/restorerApi';

const versionsCss = css({
	display: 'grid',
	gridTemplateColumns: 'minmax(240px, 33.333%) minmax(0, 1fr)',
	height: 'calc(100% - 40px)',
	overflow: 'hidden',
	'@media (max-width: 700px)': {
		gridTemplateColumns: 'minmax(180px, 40%) minmax(0, 1fr)',
	},
});
const loadingCss = css({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
	fontFamily: '"Guardian Egyptian Text"',
});

const VersionsView: FunctionComponent<{ contentId: string }> = ({
	contentId,
}) => {
	const { isLoading } = useGetSnapshotListQuery(contentId);

	return (
		<>
			<AppHeader />
			{isLoading ? (
				<div css={loadingCss} data-testid="snapshot-list-loading">
					Loading versions...
				</div>
			) : (
				<div css={versionsCss} data-testid="versions-view">
					<SnapshotSidebar contentId={contentId} />
					<ContentViewer contentId={contentId} />
					<RestoreModal contentId={contentId} />
				</div>
			)}
		</>
	);
};

export { VersionsView };
