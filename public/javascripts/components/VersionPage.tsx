import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { css } from '@emotion/react';
import { baseColors } from '@guardian/stand';
import { Button } from '@guardian/stand/Button';
import { Typography } from '@guardian/stand/Typography';
import { Link } from '@guardian/stand/Link';
import { useGetPermissionsQuery, useGetUserQuery, useGetVersionsQuery } from '../store/restorerApi';
import { useActiveVersion, useAppDispatch, useIsJsonVisible, useIsModalOpen, useReportError } from '../store/hooks';
import { openModal, selectVersion, toggleJson } from '../store/uiSlice';
import { composerUrl } from '../models';
import type { Version } from '../models';
import { SnapshotList } from './SnapshotList';
import { SnapshotContent } from './SnapshotContent';
import { RestoreModal } from './RestoreModal';

const emptyVersions: Version[] = [];
const workspaceCss = css({
    display: 'grid', gridTemplateColumns: 'minmax(300px, 34%) minmax(0, 1fr)',
    height: 'calc(100dvh - 64px)',
    '@media (max-width: 760px)': { gridTemplateColumns: 'minmax(0, 1fr)', height: 'auto' },
});
const sidebarCss = css({
    minWidth: 0, overflowY: 'auto', borderRight: `1px solid ${baseColors.neutral[700]}`,
    background: baseColors.neutral[850],
    '@media (max-width: 760px)': { maxHeight: '45dvh', borderBottom: `1px solid ${baseColors.neutral[700]}`, borderRight: 0 },
});

export const VersionPage: React.FunctionComponent = () => {
    const { contentId = '' } = useParams();
    const dispatch = useAppDispatch();
    const { currentData: versions = emptyVersions, isFetching, error, refetch } = useGetVersionsQuery(contentId);
    const { data: permissions, error: permissionError } = useGetPermissionsQuery();
    const { data: user } = useGetUserQuery();
    const active = useActiveVersion(contentId, versions);
    const modalOpen = useIsModalOpen();
    const jsonVisible = useIsJsonVisible();
    const canRestore = Boolean(user && permissions?.restore_content);
    useReportError(error);
    useReportError(permissionError);
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (modalOpen || !active || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.target instanceof Element && event.target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="dialog"]')) return;
            const index = versions.indexOf(active);
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const next = versions[(index + (event.key === 'ArrowDown' ? 1 : -1) + versions.length) % versions.length];
                if (next) dispatch(selectVersion({ contentId, key: next.key }));
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                if ((event.key === 'ArrowRight') !== jsonVisible) dispatch(toggleJson());
            } else if (event.key === 'Enter' && canRestore) {
                event.preventDefault();
                dispatch(openModal());
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [active, canRestore, contentId, dispatch, jsonVisible, modalOpen, versions]);
    if (isFetching && !versions.length) return <main css={css({ padding: 24 })}><Typography role="status">Loading versions...</Typography></main>;
    if (error && !versions.length) return <main css={css({ padding: 24 })}><Button onPress={() => { void refetch(); }}>Retry versions</Button></main>;
    if (!active) return <main css={css({ padding: 24 })}><Typography role="status">There are no snapshots available for this piece of content.</Typography><Link href="/">Search again</Link></main>;
    const latest = versions[0] ?? active;
    const url = composerUrl(latest.system.composerPrefix, contentId);
    return <main css={workspaceCss}>
        <aside css={sidebarCss} aria-label="Snapshot versions">
            <div css={css({ padding: 20, display: 'grid', gap: 12, borderBottom: `1px solid ${baseColors.neutral[700]}` })}>
                <Typography element="h1" variant="headingSm" cssOverrides={css({ overflowWrap: 'anywhere' })}>{latest.headline || 'Untitled content'}</Typography>
                {url && <Link href={url} target="_blank" rel="noopener noreferrer" cssOverrides={css({ overflowWrap: 'anywhere' })}>{contentId}</Link>}
                <Typography variant="bodySm">{versions.length} versions</Typography>
            </div>
            <SnapshotList versions={versions} active={active} />
        </aside>
        <SnapshotContent key={active.key} version={active} canRestore={canRestore} />
        {modalOpen && canRestore && <RestoreModal key={`restore:${active.key}`} version={active} canRestoreToAnyStack={permissions?.restore_content_to_any_stack === true} />}
    </main>;
};