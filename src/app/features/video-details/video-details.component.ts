import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { environment } from 'src/env/environment';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommentService } from 'src/app/core/services/comment.service';
import { UserService } from 'src/app/core/services/user.service';
import { VideoChatService } from 'src/app/core/services/video-chat.service';
import { ChatMessage } from 'src/app/core/models/chat-message.model';
import { Comment } from 'src/app/core/models/comment.model';
import { FormControl, Validators } from '@angular/forms';
import { ModalService } from 'src/app/shared/modal/modal.service';
import { FilterType } from 'src/app/core/models/filter-type.enum';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-video-details',
  templateUrl: './video-details.component.html',
  styleUrls: ['./video-details.component.css']
})
export class VideoDetailsComponent implements OnInit, OnDestroy {
    constructor(
        private route: ActivatedRoute,
        private videoPostService: VideoPostService,
        private router: Router,
        private authService: AuthService,
        private commentService: CommentService,
        private modalService: ModalService,
        private chatService: VideoChatService,
        private userService: UserService
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
    
    // Scheduled streaming
    isScheduledVideo: boolean = false;
    scheduledDateTime: Date | null = null;
    countdownMessage: string | null = null;
    videoElement: HTMLVideoElement | null = null;
    syncInterval: any = null;
    isInitializing: boolean = false;
    isSynchronizedPlaybackActive: boolean = false;
    videoDuration: number = 0;

    // Live chat
    username: string = '';
    messages: ChatMessage[] = [];
    newMessage: string = '';
    
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

                // Subscribe to chat messages
                this.chatService.messages$.subscribe((message: ChatMessage) => {
                    this.messages.push(message);
                });

                // Load user and try to connect to chat after username is loaded
                // this.userService.getCurrentUser().subscribe({
                //     next: (user) => {
                //         this.username = user.username;
                //         // Try to connect to chat (will only work if video details are also loaded)
                //         this.initializeChat();
                //     },
                //     error: (err) => {
                //         console.error('Error loading current user', err);
                //     }
                // });
                this.authService.isAuthenticated$.subscribe(
                    isAuthenticated => {
                        if (isAuthenticated) {
                        const token = this.authService.getToken();
                        if (token) {
                            try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            // Token sadrži sub (email), prikaži ga kao username
                            this.username = payload.sub || '';
                            } catch (e) {
                            console.error('Error parsing token', e);
                            }
                        }
                        } else {
                        this.username = '';
                        }
                    }
                );
            }
		});
    }

    sendMessage(): void {
        if (this.newMessage.trim() && this.videoDetails && this.username) {
            this.chatService.sendMessage(this.videoDetails.draftId.toString(), this.username, this.newMessage);
            this.newMessage = '';
        }
    }

    ngOnDestroy() {
        // Clean up the sync interval when component is destroyed
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        // Stop the video when leaving the page
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement = null;
        }

        // Disconnect from chat
        if (this.videoDetails && this.username) {
            this.chatService.disconnect(this.videoDetails.draftId.toString(), this.username);
        }
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
        this.isScheduledVideo = false;
        this.scheduledDateTime = null;
        this.countdownMessage = null;
        
        // Clear any existing sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        if (!id) {
            return;
        }

        try {
            this.videoDetails = await this.getVideoDetails(id);
            if (this.videoDetails) {
                console.log('=== VIDEO DETAILS LOADED ===');
                console.log('scheduledDateTime:', this.videoDetails.scheduledDateTime);
                console.log('Full video details:', this.videoDetails);
                
                this.videoDetails.videoPath = environment.mediaHost + this.videoDetails.videoPath;
                this.videoTags = this.extractTags(this.videoDetails.tagNames as any);
                
                // Check if video is scheduled
                if (this.videoDetails.scheduledDateTime) {
                    this.isScheduledVideo = true;
                    this.scheduledDateTime = new Date(this.videoDetails.scheduledDateTime);
                    
                    console.log('=== SCHEDULED VIDEO ===');
                    console.log('Raw from backend:', this.videoDetails.scheduledDateTime);
                    console.log('Parsed as Date:', this.scheduledDateTime);
                    console.log('Display format:', this.scheduledDateTime.toLocaleString('sr-Latn-RS'));
                    console.log('Current time:', new Date().toLocaleString('sr-Latn-RS'));
                    
                    // Don't initialize yet - wait for video metadata to load first
                    // This will be triggered by onVideoLoadedMetadata()
                }
                
                this.loadComments();
                this.loadLikeStatus();
                
                // Connect to chat after video details are loaded
                this.initializeChat();
            }
            this.loadSuggestedVideos();
        } catch (err) {
            console.error('Error loading video details', err);
        }
    }

    private initializeChat(): void {
        // Only connect if we have both username and video details
        if (this.username && this.videoDetails) {
            this.chatService.connectToVideoChat(this.videoDetails.draftId.toString(), this.username);
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
        return date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'numeric', year: 'numeric' });
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

    private async initializeSynchronizedPlayback(): Promise<void> {
        if (!this.draftId || this.isInitializing) {
            return;
        }

        this.isInitializing = true;
        
        console.log('=== INITIALIZING SYNCHRONIZED PLAYBACK ===');
        console.log('videoDuration:', this.videoDuration);

        try {
            // Get the video element
            const videoElement = document.querySelector('video') as HTMLVideoElement;
            if (!videoElement) {
                console.error('Video element not found');
                this.isInitializing = false;
                return;
            }

            this.videoElement = videoElement;
            
            // Wait for duration if not available yet
            if (!this.videoDuration || this.videoDuration === 0) {
                console.log('Waiting for video duration...');
                await new Promise<void>((resolve) => {
                    const checkDuration = () => {
                        if (videoElement.duration && videoElement.duration > 0) {
                            this.videoDuration = videoElement.duration;
                            console.log('Video duration loaded:', this.videoDuration);
                            resolve();
                        } else {
                            setTimeout(checkDuration, 100);
                        }
                    };
                    checkDuration();
                });
            }

            // Disable controls initially for scheduled videos
            this.videoElement.controls = false;

            // Prevent user from pausing/seeking during synchronized playback
            this.setupControlsProtection();

            // Get playback offset from server
            const offset = await this.videoPostService.getPlaybackOffset(this.draftId);
            
            console.log('=== PLAYBACK OFFSET ===');
            console.log('Offset from server:', offset);
            console.log('Video duration:', this.videoDuration);

            if (offset < 0) {
                // Video hasn't started yet - show countdown
                console.log('Video not started yet, showing countdown');
                this.videoElement.pause();
                this.isSynchronizedPlaybackActive = true;
                this.startCountdown(Math.abs(offset));
            } else if (offset >= this.videoDuration) {
                // Synchronized playback period is already over
                console.log('Synchronized playback already finished');
                this.isSynchronizedPlaybackActive = false;
                this.videoElement.controls = true;
                this.videoElement.currentTime = 0;
            } else {
                // Video is in synchronized playback mode
                console.log('Video in synchronized mode, seeking to:', offset);
                this.isSynchronizedPlaybackActive = true;
                this.syncVideoPlayback(offset);
                
                // Start periodic sync every 10 seconds
                this.syncInterval = setInterval(() => {
                    this.syncWithServer();
                }, 10000);
            }
        } catch (err) {
            console.error('Error initializing synchronized playback:', err);
        } finally {
            this.isInitializing = false;
        }
    }

    private startCountdown(secondsUntilStart: number): void {
        const updateCountdown = () => {
            if (secondsUntilStart <= 0) {
                this.countdownMessage = null;
                this.isSynchronizedPlaybackActive = true;
                // Video is starting now, sync with server
                this.syncWithServer();
                
                // Start periodic sync
                this.syncInterval = setInterval(() => {
                    this.syncWithServer();
                }, 10000);
            } else {
                const hours = Math.floor(secondsUntilStart / 3600);
                const minutes = Math.floor((secondsUntilStart % 3600) / 60);
                const seconds = secondsUntilStart % 60;
                
                if (hours > 0) {
                    this.countdownMessage = `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    this.countdownMessage = `${minutes}m ${seconds}s`;
                } else {
                    this.countdownMessage = `${seconds}s`;
                }
                
                secondsUntilStart--;
                setTimeout(updateCountdown, 1000);
            }
        };
        
        updateCountdown();
    }

    private async syncWithServer(): Promise<void> {
        if (!this.draftId || !this.videoElement) return;

        try {
            const offset = await this.videoPostService.getPlaybackOffset(this.draftId);
            
            if (offset >= 0) {
                // Check if synchronized playback period is over
                if (this.videoDuration > 0 && offset >= this.videoDuration) {
                    // Synchronized playback is finished, enable normal controls
                    this.isSynchronizedPlaybackActive = false;
                    this.videoElement.controls = true;
                    this.videoElement.pause();
                    this.videoElement.currentTime = 0;
                    
                    // Clear the sync interval
                    if (this.syncInterval) {
                        clearInterval(this.syncInterval);
                        this.syncInterval = null;
                    }
                } else {
                    // Still in synchronized mode
                    this.syncVideoPlayback(offset);
                }
            }
        } catch (err) {
            console.error('Error syncing with server:', err);
        }
    }

    private syncVideoPlayback(targetOffset: number): void {
        if (!this.videoElement) return;

        const currentTime = this.videoElement.currentTime;
        const drift = Math.abs(currentTime - targetOffset);

        // Only sync if drift is more than 2 seconds
        if (drift > 2) {
            console.log(`Syncing video: current=${currentTime}s, target=${targetOffset}s, drift=${drift}s`);
            this.videoElement.currentTime = targetOffset;
        }

        // Ensure video is playing
        if (this.videoElement.paused) {
            this.videoElement.play().catch(err => {
                console.error('Error playing video:', err);
            });
        }
    }

    onVideoLoadedMetadata(): void {
        // Called when video metadata is loaded
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
            this.videoDuration = videoElement.duration;
            console.log('=== VIDEO METADATA LOADED ===');
            console.log('Video duration:', this.videoDuration);
        }
        
        // Initialize synchronized playback now that we have video metadata
        if (this.isScheduledVideo && !this.isInitializing) {
            console.log('Triggering synchronized playback initialization...');
            this.initializeSynchronizedPlayback();
        }
    }

    private setupControlsProtection(): void {
        if (!this.videoElement) return;

        // Prevent pause during synchronized playback
        this.videoElement.addEventListener('pause', () => {
            if (this.isSynchronizedPlaybackActive && this.videoElement) {
                // Auto-resume if paused during sync
                setTimeout(() => {
                    if (this.videoElement && this.isSynchronizedPlaybackActive) {
                        this.videoElement.play().catch(err => {
                            console.error('Error resuming video:', err);
                        });
                    }
                }, 100);
            }
        });

        // Prevent seeking during synchronized playback
        this.videoElement.addEventListener('seeking', () => {
            if (this.isSynchronizedPlaybackActive && this.videoElement) {
                // This will be corrected by the next sync cycle
                console.log('Seeking blocked during synchronized playback');
            }
        });
    }

    getFormattedScheduledTime(): string {
        if (!this.scheduledDateTime) return '';
        
        const date = new Date(this.scheduledDateTime);
        const dateStr = date.toLocaleDateString('sr-Latn-RS', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = date.toLocaleTimeString('sr-Latn-RS', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        return `${dateStr} u ${timeStr}`;
    }
}

