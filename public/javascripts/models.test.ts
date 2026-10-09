import { describe, expect, it } from 'vitest';
import { composerUrl, contentIdFromInput, parseSnapshot, parseVersions } from './models';
import type { SnapshotSummary } from './models';
import { closeModal, openModal, selectActiveVersion, selectVersion, setError, uiReducer } from './store/uiSlice';

export const summaries: SnapshotSummary[] = [
    { system: { id: 'live', composerPrefix: 'https://composer.example' }, contentId: 'article', timestamp: '2026-01-01T12:00:00Z', info: { summary: { preview: { fields: { headline: 'Earlier headline' } } } } },
    { system: { id: 'secondary', composerPrefix: 'https://secondary.example', isSecondary: true }, contentId: 'article', timestamp: '2026-01-02T12:00:00Z', info: { metadata: { reason: 'Published' }, summary: { preview: { fields: { headline: 'Latest headline' }, settings: { legallySensitive: 'true', commentable: 'false' } }, published: true, contentChangeDetails: { revision: 42, lastModified: { user: { firstName: 'Test', lastName: 'Editor' } } } } } },
];

describe('ingress models', () => {
    it('sorts snapshots newest-first and derives their display state', () => {
        expect(parseVersions(summaries)[0]).toMatchObject({ headline: 'Latest headline', revision: 42, isLaunch: true, legallySensitive: true, comments: false, status: 'Published', modifiedBy: 'Test Editor' });
        expect(parseVersions([])).toEqual([]);
    });
    it('renders nested lists and timelines, removes executable markup and preserves raw JSON', () => {
        const response = { preview: { blocks: [{ elements: [
            { fields: { text: '<p>Body</p><script>alert(1)</script><img src="x" onerror="alert(2)">' } },
            { fields: { items: [{ title: 'List', content: [{ fields: { html: '<b>Nested</b>' } }], endNote: 'End' }] } },
            { fields: { sections: [{ title: 'Timeline', events: [{ date: 'Today', body: [{ fields: { text: '<p>Event</p>' } }] }] }] } },
        ] }] } };
        const parsed = parseSnapshot(response);
        expect(parsed.html).toContain('<b>Nested</b>');
        expect(parsed.html).toContain('<p>Event</p>');
        expect(parsed.html).not.toMatch(/<script|onerror/);
        expect(JSON.parse(parsed.json)).toEqual(response);
    });
    it('accepts content IDs and Composer URLs, but rejects invalid navigation', () => {
        expect(contentIdFromInput(' https://composer.example/content/abc-123/?view=edit ')).toBe('abc-123');
        expect(contentIdFromInput('abc-123')).toBe('abc-123');
        expect(contentIdFromInput('javascript:alert(1)')).toBeUndefined();
        expect(composerUrl('javascript:alert(1)', 'abc')).toBeUndefined();
    });
});

describe('shared UI state', () => {
    it('selects versions per article and resets modal state', () => {
        const versions = parseVersions(summaries);
        const older = versions[1]!;
        let state = uiReducer(undefined, openModal());
        state = uiReducer(state, selectVersion({ contentId: 'article', key: older.key }));
        expect(state.modalOpen).toBe(false);
        expect(selectActiveVersion({ ui: state }, 'article', versions)).toBe(older);
        expect(selectActiveVersion({ ui: state }, 'other', versions)).toBe(versions[0]);
        expect(uiReducer(state, closeModal()).showJson).toBe(false);
    });
    it('normalises errors before they enter actions or state', () => {
        const action = setError({ status: 403, data: { message: 'Access denied' } });
        expect(action.payload).toBe('Access denied');
        expect(uiReducer(undefined, action).error).toBe('Access denied');
    });
});