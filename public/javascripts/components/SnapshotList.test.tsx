import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { parseVersions } from '../models';
import { createAppStore } from '../store/store';
import { useActiveVersion } from '../store/hooks';
import { SnapshotList } from './SnapshotList';

afterEach(cleanup);

it('shares selection across separate React roots using one real store', () => {
    const versions = parseVersions([1, 2].map((revision) => ({
        system: { id: 'source', composerPrefix: 'https://composer.example' }, contentId: 'article',
        timestamp: `2026-01-0${revision}T12:00:00Z`, info: { summary: { contentChangeDetails: { revision } } },
    })));
    const store = createAppStore();
    const List: React.FunctionComponent = () => {
        const active = useActiveVersion('article', versions);
        return active && <SnapshotList active={active} versions={versions} />;
    };
    const Selection: React.FunctionComponent = () => <output>{useActiveVersion('article', versions)?.revision}</output>;
    render(<Provider store={store}><List /></Provider>);
    render(<Provider store={store}><Selection /></Provider>);
    expect(screen.getByRole('status')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: /^Revision 1,/ }));
    expect(screen.getByRole('status')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: /^Revision 1,/ })).toHaveAttribute('aria-pressed', 'true');
});