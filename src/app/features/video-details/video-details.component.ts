import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { environment } from 'src/env/environment';
import { Router } from '@angular/router';

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
    ) {}
    draftId : string | null = null;
    videoDetails : VideoResponseDTO | null = null;
    suggestedVideos: VideoResponseDTO[] = [];

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

        if (!this.draftId) {
            return;
        }

        try {
            this.videoDetails = await this.getVideoDetails(this.draftId);
            if (this.videoDetails) {
                this.videoDetails.videoPath = environment.mediaHost + this.videoDetails.videoPath;
            }
            this.loadSuggestedVideos();
        } catch (err) {
            console.error('Error loading video details', err);
        }
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

    getThumbnailUrl(path: String): String {
        return this.videoPostService.getThumbnailUrl(path);
    }
}
