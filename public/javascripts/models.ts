import moment from 'moment';
import DOMPurify from 'dompurify';

export type System = {
    id: string;
    composerPrefix: string;
    isSecondary?: boolean;
};

type Fields = {
    headline?: string;
    standfirst?: string;
    trailText?: string;
};

export type SnapshotSummary = {
    system: System;
    contentId: string;
    timestamp: string;
    info: {
        metadata?: { reason?: string };
        summary?: {
            preview?: { fields?: Fields; settings?: Record<string, string> };
            contentChangeDetails?: {
                revision?: number;
                published?: unknown;
                lastModified?: { user?: { firstName?: string; lastName?: string } };
            };
            published?: boolean;
            scheduledLaunchDate?: string;
        };
    };
};

export type Version = {
    key: string;
    system: System;
    contentId: string;
    timestamp: string;
    headline: string;
    revision: number | undefined;
    reason: string;
    isLaunch: boolean;
    legallySensitive: boolean;
    comments: boolean | undefined;
    status: string;
    modifiedBy: string;
};

export type SnapshotArgs = Pick<Version, 'contentId' | 'timestamp'> & { systemId: string };

type Element = {
    fields: {
        text?: string;
        html?: string;
        items?: Array<{ title?: string; bio?: string; endNote?: string; byline?: string; content?: Element[] }>;
        sections?: Array<{ title?: string; events?: Array<{ title?: string; date?: string; body?: Element[] }> }>;
    };
};

export type SnapshotResponse = {
    preview?: { fields?: Fields; blocks?: Array<{ elements?: Element[] }> };
};

export type Snapshot = {
    headline: string;
    standfirst: string;
    trailText: string;
    html: string;
    json: string;
};

export type Destination = {
    systemId: string;
    displayName: string;
    composerPrefix: string;
    available: boolean;
    changeDetails?: { revisionId: number; lastModified: string };
};

export type Permissions = {
    restore_content?: boolean;
    restore_content_to_any_stack?: boolean;
};

export type User = { firstName?: string; lastName?: string; email: string; avatarUrl?: string };

export const formatDate = (date: string): string => moment(date).format('HH:mm:ss D MMMM YYYY');

export const parseVersions = (data: SnapshotSummary[]): Version[] => {
    if (!Array.isArray(data)) throw new Error('Invalid snapshot list response');
    return data.map(({ system, contentId, timestamp, info }): Version => {
        const summary = info.summary;
        const settings = summary?.preview?.settings;
        const details = summary?.contentChangeDetails;
        const user = details?.lastModified?.user;
        const reason = info.metadata?.reason ?? '';
        const scheduled = summary?.scheduledLaunchDate;
        const embargoed = settings?.['embargoedUntil'];
        const status = scheduled ? `Scheduled ${moment(scheduled).format('ddd D MMMM YYYY')}`
            : embargoed ? `Embargoed until ${moment(embargoed).format('ddd D MMMM YYYY')}`
            : summary?.published ? 'Published' : details?.published ? 'Taken down' : '';
        return {
            key: JSON.stringify([system.id, contentId, timestamp]),
            system, contentId, timestamp,
            headline: summary?.preview?.fields?.headline ?? '',
            revision: details?.revision,
            reason,
            isLaunch: reason === 'Published' || reason.toLowerCase().includes('launch'),
            legallySensitive: settings?.['legallySensitive'] === 'true',
            comments: settings?.['commentable'] === undefined ? undefined : settings['commentable'] === 'true',
            status,
            modifiedBy: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '-',
        };
    }).sort((first, second) => Date.parse(second.timestamp) - Date.parse(first.timestamp));
};

const htmlFromElements = (elements: Element[] = []): string => elements.map(({ fields }) => {
    if (fields.text) return fields.text;
    if (fields.html) return fields.html;
    if (fields.items) return fields.items.map((item) => [
        item.title ? `<h2>${item.title}</h2>` : '',
        item.byline ? `<p>${item.byline}</p>` : '',
        item.bio ?? '',
        htmlFromElements(item.content),
        item.endNote ? `<p><em>${item.endNote}</em></p>` : '',
    ].join('')).join('');
    if (fields.sections) return fields.sections.map((section) => `${section.title ?? ''}${(section.events ?? []).map((event) => [
        event.title ? `<h2>${event.title}</h2>` : '',
        event.date ? `<p>${event.date}</p>` : '',
        htmlFromElements(event.body),
    ].join('')).join('')}`).join('');
    return '';
}).join('');

export const parseSnapshot = (data: SnapshotResponse): Snapshot => ({
    headline: data.preview?.fields?.headline ?? '',
    standfirst: data.preview?.fields?.standfirst ?? '',
    trailText: data.preview?.fields?.trailText ?? '',
    html: DOMPurify.sanitize(htmlFromElements(data.preview?.blocks?.flatMap((block) => block.elements ?? [])), { USE_PROFILES: { html: true }, ADD_TAGS: ['gu-note', 'gu-flag', 'gu-correct'] }),
    json: JSON.stringify(data, null, 2),
});

export const contentIdFromInput = (input: string): string | undefined => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;
    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
        return /^\/content\/([a-zA-Z0-9_-]+)\/?$/.exec(url.pathname)?.[1];
    } catch {
        return undefined;
    }
};

export const composerUrl = (prefix: string, contentId: string): string | undefined => {
    try {
        const url = new URL(prefix);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
        return `${url.href.replace(/\/$/, '')}/content/${encodeURIComponent(contentId)}`;
    } catch {
        return undefined;
    }
};