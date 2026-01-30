import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { environment } from 'src/env/environment';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommentService } from 'src/app/core/services/comment.service';
import { Comment } from 'src/app/core/models/comment.model';
import { FormControl, Validators } from '@angular/forms';
import { ModalService } from 'src/app/shared/modal/modal.service';
import { FilterType } from 'src/app/core/models/filter-type.enum';

@Component({
  selector: 'app-video-details',
  templateUrl: './video-details.component.html',
  styleUrls: ['./video-details.component.css']
})
export class VideoDetailsComponent {
    constructor(
        private route: ActivatedRoute,
        private videoPostService: VideoPostService,
        private router: Router,
        private authService: AuthService,
        private commentService: CommentService,
        private modalService: ModalService
    ) {}
    draftId : string | null = null;
    videoDetails : VideoResponseDTO | null = null;
    videoTags: string[] = [];
    suggestedVideos: VideoResponseDTO[] = [];
    suggestedPage: number = 0;
    suggestedPageSize: number = 12;
    loadingSuggested: boolean = false;
    hasMoreSuggested: boolean = true;
    comments: Comment[] = [];
    commentPage: number = 0;
    commentPageSize: number = 10;
    totalCommentPages: number = 0;
    totalComments: number = 0;
    loadingComments: boolean = false;
    commentControl = new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]);
    
    // Like sistem
    likeCount: number = 0;
    likedByUser: boolean = false;
    
    get isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    handleLike(): void {
        if (!this.isLoggedIn) {
            this.modalService.show('Morate biti prijavljeni da biste lajkovali!', 'Prijava potrebna');
            return;
        }
        
        if (!this.videoDetails) return;

        this.videoPostService.toggleLike(this.videoDetails.id).subscribe({
            next: (response) => {
                this.likeCount = response.likeCount;
                this.likedByUser = response.likedByUser;
            },
            error: (err) => {
                console.error('Greška pri lajkovanju', err);
                this.modalService.show('Greška pri lajkovanju. Pokušajte ponovo.', 'Greška');
            }
        });
    }

    ngOnInit() {
		// React to id changes on the same /watch/:id route
		this.route.paramMap.subscribe(params => {
			const id = params.get('id');
			if (id) {
				this.draftId = id;
				this.resetSuggestedVideos();
				this.loadVideoAndSuggestions(id);
			}
		});
    }

    resetSuggestedVideos(): void {
        this.suggestedVideos = [];
        this.suggestedPage = 0;
        this.hasMoreSuggested = true;
    }

    private async getVideoDetails(draftId : string) : Promise<VideoResponseDTO> {
        return await this.videoPostService.getVideoDetails(draftId);
    }

    private async loadVideoAndSuggestions(id: string | null) {
        this.videoDetails = null;
        this.videoTags = [];
        this.comments = [];
        this.commentPage = 0;
        this.likeCount = 0;
        this.likedByUser = false;

        if (!id) {
            return;
        }

        try {
            this.videoDetails = await this.getVideoDetails(id);
            if (this.videoDetails) {
                this.videoDetails.videoPath = environment.mediaHost + this.videoDetails.videoPath;
                this.videoTags = this.extractTags(this.videoDetails.tagNames as any);
                this.loadComments();
                this.loadLikeStatus();
            }
            this.loadSuggestedVideos();
        } catch (err) {
            console.error('Error loading video details', err);
        }
    }

    private extractTags(raw: unknown): string[] {
        if (raw == null) {
            return [];
        }

        if (Array.isArray(raw)) {
            return raw
                .map(t => t != null ? t.toString().trim() : '')
                .filter(t => t.length > 0);
        }

        return raw
            .toString()
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }

    private loadSuggestedVideos(): void {
        if (this.loadingSuggested || !this.hasMoreSuggested) return;

        this.loadingSuggested = true;
        this.videoPostService.getAllVideoPosts(this.suggestedPage, this.suggestedPageSize, FilterType.ALL_TIME).subscribe({
            next: (videos) => {
                const filtered = videos.filter(v => v.draftId !== this.draftId);
                
                if (filtered.length === 0) {
                    this.hasMoreSuggested = false;
                } else {
                    this.suggestedVideos = [...this.suggestedVideos, ...filtered];
                    this.suggestedPage++;
                }
                this.loadingSuggested = false;
            },
            error: (err) => {
                console.error('Error loading suggested videos', err);
                this.loadingSuggested = false;
            }
        });
    }

    loadMoreSuggestedVideos(): void {
        this.loadSuggestedVideos();
    }

    getThumbnailUrl(draftId: String): String {
        return environment.apiHost + "video-posts/" + draftId + "/thumbnail";
    }

    loadLikeStatus(): void {
        if (!this.videoDetails) return;

        this.videoPostService.getLikeStatus(this.videoDetails.id).subscribe({
            next: (response) => {
                this.likeCount = response.likeCount;
                this.likedByUser = response.likedByUser;
            },
            error: (err) => {
                console.error('Greška pri učitavanju like statusa', err);
            }
        });
    }

    loadComments(): void {
        if (!this.videoDetails) {
            console.log('loadComments: videoDetails is null');
            return;
        }
        
        console.log('Loading comments for video ID:', this.videoDetails.id, 'page:', this.commentPage);
        this.loadingComments = true;
        this.commentService.getComments(this.videoDetails.id, this.commentPage, this.commentPageSize).subscribe({
            next: (response) => {
                console.log('Comments loaded:', response);
                if (this.commentPage === 0) {
                    this.comments = response.content;
                } else {
                    this.comments = [...this.comments, ...response.content];
                }
                this.totalCommentPages = response.totalPages;
                this.totalComments = response.totalElements;
                this.loadingComments = false;
            },
            error: (err) => {
                console.error('Greška pri učitavanju komentara', err);
                this.loadingComments = false;
            }
        });
    }

    submitComment(): void {
        if (!this.isLoggedIn) {
            this.modalService.show('Morate biti prijavljeni da biste komentarisali!', 'Prijava potrebna');
            return;
        }

        if (this.commentControl.invalid || !this.videoDetails) {
            return;
        }

        const content = this.commentControl.value?.trim();
        if (!content) return;

        this.commentService.createComment(this.videoDetails.id, { content }).subscribe({
            next: (newComment) => {
                console.log('Komentar dodat:', newComment);
                // Odmah dodaj komentar na vrh liste
                this.commentPage = 0;
                this.loadComments();
                this.commentControl.reset();
            },
            error: (err) => {
                console.error('Greška pri kreiranju komentara', err);
                this.modalService.show('Greška pri dodavanju komentara. Pokušajte ponovo.', 'Greška');
            }
        });
    }

    async deleteComment(commentId: number): Promise<void> {
        const confirmed = await this.modalService.confirm(
            'Da li ste sigurni da želite da obrišete ovaj komentar?',
            'Brisanje komentara'
        );
        
        if (!confirmed) {
            return;
        }

        this.commentService.deleteComment(commentId).subscribe({
            next: () => {
                this.comments = this.comments.filter(c => c.id !== commentId);
            },
            error: (err) => {
                console.error('Greška pri brisanju komentara', err);
                this.modalService.show('Greška pri brisanju komentara. Pokušajte ponovo.', 'Greška');
            }
        });
    }

    loadMoreComments(): void {
        if (this.commentPage < this.totalCommentPages - 1 && !this.loadingComments) {
            this.commentPage++;
            this.loadComments();
        }
    }

    getTimeAgo(createdAt: Date): string {
        const date = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Upravo sad';
        if (diffMins < 60) return `Pre ${diffMins} min`;
        if (diffHours < 24) return `Pre ${diffHours} h`;
        if (diffDays < 7) return `Pre ${diffDays} dana`;
        return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }

    canDeleteComment(comment: Comment): boolean {
        if (!this.isLoggedIn) return false;
        const token = this.authService.getToken();
        if (!token) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userEmail = payload.sub;
            return comment.authorEmail === userEmail;
        } catch {
            return false;
        }
    }
}

