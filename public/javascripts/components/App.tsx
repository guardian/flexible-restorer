import { useEffect, useState } from 'react';
import { Global, css } from '@emotion/react';
import { baseColors } from '@guardian/stand';
import { Button } from '@guardian/stand/Button';
import { TextInput } from '@guardian/stand/TextInput';
import { Typography } from '@guardian/stand/Typography';
import { Link } from '@guardian/stand/Link';
import { InlineMessage } from '@guardian/stand/InlineMessage';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { contentIdFromInput } from '../models';
import { useAppDispatch, useError, useReportError } from '../store/hooks';
import { clearError, resetView } from '../store/uiSlice';
import { useGetUserQuery } from '../store/restorerApi';
import { VersionPage } from './VersionPage';
import { FeatureSettings } from './FeatureSettings';
import logo from '../../images/restorer-white-38.svg';

const globalStyles = css({
    '*': { boxSizing: 'border-box' },
    body: { margin: 0, color: baseColors.neutral[100], background: baseColors.neutral[900], fontFamily: '"Open Sans", sans-serif', fontSize: 14, letterSpacing: 0 },
    'button, input': { font: 'inherit' },
    'h1, h2, h3, p': { margin: 0 },
    'a, button, input': { '&:focus-visible': { outline: `3px solid ${baseColors.cyan[400]}`, outlineOffset: 3 } },
    'img, video': { maxWidth: '100%' },
    pre: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 13 },
});

const headerCss = css({
    minHeight: 64, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16,
    padding: '12px 24px', background: baseColors.neutral[50], color: 'white',
    justifyContent: 'space-between',
    a: { color: 'white', textDecoration: 'none' },
    '@media (max-width: 600px)': { padding: 12, gap: 8 },
});

const searchCss = css({
    maxWidth: 660, margin: '72px auto', padding: 24,
    display: 'grid', gap: 24,
    '@media (max-width: 600px)': { margin: '24px auto', padding: 16 },
});

const Search: React.FunctionComponent = () => {
    const [query, setQuery] = useState('');
    const [invalid, setInvalid] = useState(false);
    const navigate = useNavigate();
    return <main css={searchCss}>
        <Typography element="h1" variant="headingLg">Find content versions</Typography>
        <form css={css({ display: 'grid', gap: 20 })} onSubmit={(event) => {
            event.preventDefault();
            const contentId = contentIdFromInput(query);
            if (contentId) void navigate(`/content/${encodeURIComponent(contentId)}/versions`);
            else setInvalid(true);
        }}>
            <TextInput label="Composer URL or content ID" value={query} onChange={(value) => { setQuery(value); setInvalid(false); }} isRequired isInvalid={invalid} />
            {invalid && <InlineMessage level="error">Enter a valid Composer content URL or content ID.</InlineMessage>}
            <Button type="submit" icon="search" isDisabled={!query.trim()} cssOverrides={css({ justifySelf: 'start' })}>Search</Button>
        </form>
    </main>;
};

const ErrorBanner: React.FunctionComponent = () => {
    const error = useError();
    const dispatch = useAppDispatch();
    if (!error) return null;
    return <div role="alert" css={css({ padding: 16, background: baseColors.red[900], display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between' })}>
        <InlineMessage level="error">{error}</InlineMessage>
        <Button variant="tertiary" onPress={() => dispatch(clearError())}>Dismiss</Button>
    </div>;
};

export const App: React.FunctionComponent = () => {
    const { pathname } = useLocation();
    const dispatch = useAppDispatch();
    const { data: user, error } = useGetUserQuery();
    useReportError(error);
    useEffect(() => {
        dispatch(resetView());
        const host = window.location.hostname;
        const telemetry = host === 'restorer.gutools.co.uk' ? 'https://user-telemetry.gutools.co.uk'
            : host === 'restorer.code.dev-gutools.co.uk' ? 'https://user-telemetry.code.dev-gutools.co.uk'
            : 'https://user-telemetry.local.dev-gutools.co.uk';
        new Image().src = `${telemetry}/guardian-tool-accessed?${new URLSearchParams({ app: 'restorer', path: pathname })}`;
    }, [dispatch, pathname]);
    return <>
        <Global styles={globalStyles} />
        <header css={headerCss}>
            <Link href="/" cssOverrides={css({ display: 'inline-flex', alignItems: 'center', gap: 12 })}>
                <img src={logo} alt="" width="32" height="32" />
                <Typography variant="headingSm" cssOverrides={css({ color: baseColors.neutral[900] })}>Composer Restorer</Typography>
            </Link>
            <div css={css({ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' })}>
                {user && <Typography variant="bodySm" cssOverrides={css({ color: baseColors.neutral[900], overflowWrap: 'anywhere' })}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</Typography>}
                <FeatureSettings />
            </div>
        </header>
        <ErrorBanner />
        <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/content/:contentId/versions" element={<VersionPage key={pathname} />} />
            <Route path="*" element={<main css={searchCss}><Typography element="h1">Page not found</Typography><Link href="/">Search content</Link></main>} />
        </Routes>
    </>;
};