export interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  authorUsername: string;
  authorEmail: string;
  videoId: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CommentPageResponse {
  content: Comment[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
