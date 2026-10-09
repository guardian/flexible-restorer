import { useState } from 'react';
import { css } from '@emotion/react';
import { baseColors } from '@guardian/stand';
import { Button } from '@guardian/stand/Button';
import { Typography } from '@guardian/stand/Typography';
import { Link } from '@guardian/stand/Link';
import { useGetSnapshotQuery } from '../store/restorerApi';
import { useAppDispatch, useIsJsonVisible, useReportError } from '../store/hooks';
import { openModal, setError, toggleJson } from '../store/uiSlice';
import type { Version } from '../models';

const toolbarCss = css({
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: 16,
    borderBottom: `1px solid ${baseColors.neutral[700]}`, background: baseColors.neutral[850],
});
const articleCss = css({
    padding: 24, overflowWrap: 'anywhere', lineHeight: 1.6,
    fontFamily: '"Guardian Text Egyptian", Georgia, serif',
    'p, h2, h3, ul, ol, blockquote': { margin: '0 0 16px' },
    'iframe, table': { maxWidth: '100%' },
    '@media (max-width: 600px)': { padding: 16 },
});

export const SnapshotContent: React.FunctionComponent<{ version: Version; canRestore: boolean }> = ({ version, canRestore }) => {
    const dispatch = useAppDispatch();
    const jsonVisible = useIsJsonVisible();
    const [copied, setCopied] = useState(false);
    const { currentData: snapshot, error, isFetching, refetch } = useGetSnapshotQuery({ systemId: version.system.id, contentId: version.contentId, timestamp: version.timestamp });
    useReportError(error);
    return <section aria-label="Snapshot content" css={css({ minWidth: 0, overflowY: 'auto' })}>
        <div css={toolbarCss}>
            {canRestore && <Button icon="restore" onPress={() => dispatch(openModal())} isDisabled={!snapshot || isFetching}>Restore</Button>}
            <Button variant="secondary" icon={copied ? 'check' : 'content_copy'} isDisabled={!snapshot} onPress={() => {
                if (!snapshot) return;
                void (async () => {
                    try { await navigator.clipboard.writeText(snapshot.json); setCopied(true); }
                    catch (error: unknown) { dispatch(setError(error)); }
                })();
            }}>{copied ? 'Copied!' : 'Copy JSON'}</Button>
            <Button variant="secondary" icon="code" aria-pressed={jsonVisible} onPress={() => dispatch(toggleJson())}>{jsonVisible ? 'Show TEXT' : 'Show JSON'}</Button>
            <Link href={`/export/${encodeURIComponent(version.contentId)}/git`} target="_blank" rel="noopener noreferrer">Export all as Git Repo</Link>
            <Link href={`/export/${encodeURIComponent(version.contentId)}/zip`} target="_blank" rel="noopener noreferrer">Export all as Zip</Link>
        </div>
        {isFetching && <Typography role="status" cssOverrides={css({ padding: 24 })}>Loading snapshot...</Typography>}
        {error && <Button onPress={() => { void refetch(); }}>Retry snapshot</Button>}
        {snapshot && <>
            <dl css={css({ margin: 0, padding: 24, display: 'grid', gap: 16, borderBottom: `1px solid ${baseColors.neutral[700]}`, overflowWrap: 'anywhere' })}>
                {([['Headline', snapshot.headline], ['Standfirst', snapshot.standfirst], ['TrailText', snapshot.trailText]] as const).map(([label, text]) => <div key={label}>
                    <Typography element="dt" variant="headingXs">{label}</Typography>
                    <Typography element="dd" variant="bodyMd" cssOverrides={css({ margin: '4px 0 0' })}>{text || '-'}</Typography>
                </div>)}
            </dl>
            {jsonVisible ? <pre data-testid="snapshot-json" css={css({ padding: 24 })}><code>{snapshot.json}</code></pre>
                : <article data-testid="snapshot-html" css={articleCss} dangerouslySetInnerHTML={{ __html: snapshot.html }} />}
        </>}
    </section>;
};