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
}

export interface VideoPostDraftDTO {
    videoPath: String;
    thumbnailPath: String;
    title: String
    description: String;
    draftId: String;
}