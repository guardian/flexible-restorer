import moment from 'moment';
import { css } from '@emotion/react';
import { baseColors } from '@guardian/stand';
import { Button } from '@guardian/stand/Button';
import { Typography } from '@guardian/stand/Typography';
import { Icon } from '@guardian/stand/Icon';
import { formatDate } from '../models';
import type { Version } from '../models';
import { useAppDispatch, useFeatureFlag } from '../store/hooks';
import { selectVersion } from '../store/uiSlice';

const rowCss = (active: boolean, launch: boolean, compact: boolean) => css({
    width: '100%', height: 'auto', justifyContent: 'start', textAlign: 'left', whiteSpace: 'normal',
    borderRadius: 0, padding: compact ? 8 : 16, display: 'grid', gridTemplateColumns: '36px minmax(0, 1fr)', gap: 12,
    border: 0, borderLeft: `4px solid ${active ? baseColors.cyan[400] : 'transparent'}`,
    background: active ? baseColors.cyan[900] : launch ? baseColors.yellow[900] : baseColors.neutral[900],
    color: baseColors.neutral[100],
    '&[data-hovered]': { background: baseColors.neutral[800] },
});

export const SnapshotList: React.FunctionComponent<{ versions: Version[]; active: Version }> = ({ versions, active }) => {
    const dispatch = useAppDispatch();
    const compact = useFeatureFlag('compactSnapshotList');
    return <ol css={css({ listStyle: 'none', margin: 0, padding: 0 })}>
        {versions.map((version, index) => <li key={version.key} data-testid="snapshot-list-item" data-active={version.key === active.key} data-launch={version.isLaunch}>
            {version.system.isSecondary && <Typography element="p" variant="bodySm" cssOverrides={css({ padding: '8px 16px', background: baseColors.yellow[800] })}>This snapshot came from composer-secondary</Typography>}
            <Button aria-label={`Revision ${version.revision ?? versions.length - index}, ${formatDate(version.timestamp)}`} aria-pressed={version.key === active.key}
                onPress={() => dispatch(selectVersion({ contentId: version.contentId, key: version.key }))}
                cssOverrides={rowCss(version.key === active.key, version.isLaunch, compact)}>
                <Typography element="span" variant="headingSm">{version.revision ?? versions.length - index}</Typography>
                <span css={css({ display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' })}>
                    <Typography element="span" variant="bodySm">{formatDate(version.timestamp)}</Typography>
                    <Typography element="span" variant="bodySm">{moment(version.timestamp).fromNow()}</Typography>
                    <Typography element="span" variant="bodySm">Last modified by: {version.modifiedBy}</Typography>
                    <Typography element="span" variant="bodySm">{version.reason}</Typography>
                    <span css={css({ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' })}>
                        {version.legallySensitive && <span data-testid="legally-sensitive" title="Legally sensitive"><Icon symbol="gavel" /><Typography element="span" variant="bodySm">Legally sensitive</Typography></span>}
                        {version.comments !== undefined && <Typography element="span" variant="bodySm">Comments {version.comments ? 'on' : 'off'}</Typography>}
                        <Typography element="span" variant="bodySm">{version.status}</Typography>
                    </span>
                </span>
            </Button>
            {versions[index + 1] && <Typography element="p" variant="bodySm" cssOverrides={css({ textAlign: 'right', padding: '4px 16px', color: baseColors.neutral[300] })}>{moment(version.timestamp).from(versions[index + 1]?.timestamp, true)} between snapshots</Typography>}
        </li>)}
    </ol>;
};