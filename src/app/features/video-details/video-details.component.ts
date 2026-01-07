import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { environment } from 'src/env/environment';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

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
    ) {}
    draftId : string | null = null;
    videoDetails : VideoResponseDTO | null = null;
    videoTags: string[] = [];
    suggestedVideos: VideoResponseDTO[] = [];
    get isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    handleLike(): void {
        if (!this.isLoggedIn) {
            alert('Morate biti prijavljeni da biste lajkovali!');
        } else {
            // Implementacija lajkovanja
        }
    }

    handleDislike(): void {
        if (!this.isLoggedIn) {
            alert('Morate biti prijavljeni da biste dislajkovali!');
        } else {
            // Implementacija dislajkovanja
        }
    }

    ngOnInit() {
		// React to id changes on the same /watch/:id route
		this.route.paramMap.subscribe(params => {
			const id = params.get('id');
			this.loadVideoAndSuggestions(id);
		});
    }

    private async getVideoDetails(draftId : string) : Promise<VideoResponseDTO> {
        return await this.videoPostService.getVideoDetails(draftId);
    }

    private async loadVideoAndSuggestions(id: string | null) {
        this.draftId = id;
        this.videoDetails = null;
        this.videoTags = [];

        if (!this.draftId) {
            return;
        }

        try {
            this.videoDetails = await this.getVideoDetails(this.draftId);
            if (this.videoDetails) {
                this.videoDetails.videoPath = environment.mediaHost + this.videoDetails.videoPath;
                this.videoTags = this.extractTags(this.videoDetails.tagNames as any);
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
        this.videoPostService.getAllVideoPosts(0).subscribe({
            next: (videos) => {
                this.suggestedVideos = videos
                    .filter(v => v.draftId !== this.draftId)
                    .slice(0, 6);
            },
            error: (err) => {
                console.error('Error loading suggested videos', err);
            }
        });
    }

    getThumbnailUrl(draftId: String): String {
        return environment.apiHost + "video-posts/" + draftId + "/thumbnail";
    }
}
