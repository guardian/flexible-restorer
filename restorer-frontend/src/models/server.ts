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
                settings: {
                    legallySensitive?: "false" | "true";
                    commentable?: "false" | "true";
                    embargoedUntil?:string;
                };
            };
            type: string;
            published: boolean;
            scheduledLaunchDate?: number;
            contentChangeDetails: {
                lastModified: ChangeRecord;
                created?: ChangeRecord;
                published?: ChangeRecord;
                revision: number;
            };
        };
    };
}
