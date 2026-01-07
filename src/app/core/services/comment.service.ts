import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment, CreateCommentRequest, CommentPageResponse } from '../models/comment.model';
import { environment } from 'src/env/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseUrl = environment.apiHost + 'interactions';

  constructor(private http: HttpClient) {}

  getComments(videoId: number, page: number = 0, size: number = 10): Observable<CommentPageResponse> {
    return this.http.get<CommentPageResponse>(
      `${this.baseUrl}/videos/${videoId}/comments`,
      { params: { page: page.toString(), size: size.toString() } }
    );
  }

  createComment(videoId: number, request: CreateCommentRequest): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.baseUrl}/videos/${videoId}/comments`,
      request
    );
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`);
  }
}
