/*
prompt:
build a typescript class called "SnapshotService" in a new file in restorer-frontend/src. The class should have method matching those in SnapshotCollectionService.js, but using fetch, not the angular $http function. use the /conf/routes file to look up the scala controllers for the backend in order to generate the expected typescript types for the json returned by the backend

prompt 2:
#sym:SnapshotService.get should not be the same as #sym:SnapshotService.getList. Look at SnapshotCollectionService.js - the URL generated from the id is not the same
/*

/**
 * SnapshotService - TypeScript service for snapshot-related API calls
 * Based on SnapshotCollectionService.js but using fetch instead of Angular $http
 */

// Types based on Scala models

export interface SnapshotId {
    contentId: string;
    timestamp: string;
}

export interface SystemInfo {
    id: string;
    isSecondary: boolean;
    composerPrefix: string;
}

type ChangeRecord = {
    date: number;
    user: {
        email: string;
        firstName: string;
        lastName: string;
    };
};

export interface VersionListItem {
    contentId: string;
    timestamp: string;
    system: SystemInfo;
    info: {
        metadata: {
            reason?: string;
        };
        summary: {
            preview: {
                fields: {
                    headline?: string;
                    standfirst?: string;
                    trailText?: string;
                };
                settings: { legallySensitive?: "false" | "true" };
            };
            type: string;
            published: boolean;
            contentChangeDetails: {
                lastModified: ChangeRecord;
                created: ChangeRecord;
                published?: ChangeRecord;
                revision: number;
            };
        };
    };
}

export interface SnapshotResponse {
    [key: string]: unknown;
}

export type VersionListResponse = Array<VersionListItem>;

export class SnapshotService {
    private baseUrl = "";

    constructor(baseUrl: string = "") {
        this.baseUrl = baseUrl;
    }

    /**
     * Get version list for a specific content ID
     * GET /api/1/versionList/:contentId
     */
    async getList(contentId: string): Promise<VersionListResponse> {
        const response = await fetch(
            `${this.baseUrl}/api/1/versionList/${contentId}`,
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch version list for ${contentId}: ${response.statusText}`,
            );
        }
        return response.json();
    }

    /**
     * Get a specific snapshot
     * GET /api/1/version/:systemId/:contentId/:timestamp
     */
    async getSnapshot(
        systemId: string,
        contentId: string,
        timestamp: string,
    ): Promise<SnapshotResponse> {
        const response = await fetch(
            `${this.baseUrl}/api/1/version/${systemId}/${contentId}/${timestamp}`,
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch snapshot for ${contentId} at ${timestamp}: ${response.statusText}`,
            );
        }
        return response.json();
    }

    /**
     * Get versions for a content ID
     * GET /api/1/versions/:contentId
     * (matches the original SnapshotCollectionService.js interface)
     */
    async get(contentId: string): Promise<VersionListResponse> {
        const response = await fetch(
            `${this.baseUrl}/api/1/versions/${contentId}`,
        );
        if (!response.ok) {
            throw new Error(
                `Failed to fetch versions for ${contentId}: ${response.statusText}`,
            );
        }
        return response.json();
    }
}

export default SnapshotService;
