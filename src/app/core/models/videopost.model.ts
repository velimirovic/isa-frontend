export enum VideoPostStatus {
    DRAFT,
    PUBLISHED
}

export interface VideoResponseDTO {
    id: number;
    videoPath: String;
    thumbnailPath: String;
    title: String;
    description: String;
    createdAt: Date;
    authorEmail: String;
    authorUsername: String;
    status: VideoPostStatus;
    draftId: String;
    viewCount: number;
    tagNames: String[];
    likeCount?: number;
    likedByUser?: boolean;
    latitude?: number;
    longitude?: number;
}

export interface VideoPostDraftDTO {
    videoPath: String;
    thumbnailPath: String;
    title: String
    description: String;
    draftId: String;
    latitude?: number;
    longitude?: number;
}