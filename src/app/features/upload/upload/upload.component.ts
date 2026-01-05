import { Component, OnInit, OnDestroy } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
} from '@angular/forms';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { environment } from 'src/env/environment';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { Router } from '@angular/router';

@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit, OnDestroy {
    form: FormGroup;

    // Drag & drop state
    isDraggingVideo = false;
    isDraggingThumbnail = false;

    private draftId: string | null = null;

    // Files
    private videoFile: File | null = null;
    private thumbnailFile: File | null = null;

    // Previews
    videoPreviewUrl: string | null = null;
    thumbnailPreviewUrl: string | null = null;

    videoPath: string | null = null;
    thumbnailPath: string | null = null;

    // Errors & progress
    videoError = '';
    thumbnailError = '';
    uploadProgress = 0;

    tags: string[] = [];
    tagsError = '';

    constructor(
        private fb: FormBuilder,
        private videoPostService: VideoPostService,
        private router : Router,
    ) {
        this.form = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.maxLength(2000)]],
        });
    }

    // Getters for template
    get title(): AbstractControl | null {
        return this.form.get('title');
    }

    get description(): AbstractControl | null {
        return this.form.get('description');
    }

    // Drag & drop handlers - video
    onDragOverVideo(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingVideo = true;
    }

    onDragLeaveVideo(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingVideo = false;
    }

    onDropVideo(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingVideo = false;

        const file = event.dataTransfer?.files?.[0];
        if (file) {
            this.handleVideoFile(file);
        }
    }

    // Drag & drop handlers - thumbnail
    onDragOverThumbnail(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingThumbnail = true;
    }

    onDragLeaveThumbnail(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingThumbnail = false;
    }

    onDropThumbnail(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingThumbnail = false;

        const file = event.dataTransfer?.files?.[0];
        if (file) {
            this.handleThumbnailFile(file);
        }
    }

    // File input change handlers
    onVideoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] || null;
        if (file) {
            this.handleVideoFile(file);
        }
    }

    onThumbnailSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] || null;
        if (file) {
            this.handleThumbnailFile(file);
        }
    }


    async handleUpload(): Promise<void> {
        this.videoError = '';
        this.thumbnailError = '';
        this.tagsError = '';

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (!this.videoPath) {
            this.videoError = 'Video fajl je obavezan.';
            return;
        }

        if (!this.thumbnailPath) {
            this.thumbnailError = 'Thumbnail fajl je obavezan.';
            return;
        }
        

        // Ovde dodaješ svoju upload logiku (FormData, service, itd.)
        // Primer:
        const formData = new FormData();
        formData.append('title', this.form.value.title);
        formData.append('description', this.form.value.description);
        
        var res = ""
        if (this.title && 
            this.description && 
            this.draftId) {
            console.log(this.title.value);
            console.log(this.description.value);

            res = await this.videoPostService.uploadPostDetails(this.title.value, this.description.value, this.tags, this.draftId);
        }
        
        if (res.match("success") && this.draftId) 
        {            
            var result = await this.videoPostService.publishVideoPost(this.draftId);
            console.log(result);
            this.router.navigate(['/']);
        }
    }

    onTagEnter(event: KeyboardEvent, input: HTMLInputElement): void {
        event.preventDefault();
        const value = input.value.trim();
        this.addTag(value);
        input.value = '';
    }

    addTagFromInput(input: HTMLInputElement): void {
        const value = input.value.trim();
        this.addTag(value);
        input.value = '';
    }

    private addTag(value: string): void {
        if (!value) {
            return;
        }

        if (!this.tags.includes(value)) {
            this.tags.push(value);
            this.tagsError = '';
        } else {
            this.tagsError = 'Tag je već dodat.';
        }
    }

    removeTag(tag: string): void {
        this.tags = this.tags.filter(t => t !== tag);
    }

    removeAllTags(): void {
        this.tags = [];
        this.tagsError = '';
    }

    // Helpers
    private async handleVideoFile(file: File): Promise<void> {
        this.videoFile = file;
        this.videoError = '';

        if (this.videoPreviewUrl) {
            URL.revokeObjectURL(this.videoPreviewUrl);
        }
        this.videoPreviewUrl = URL.createObjectURL(file);

        if (!this.draftId) {
            //console.error('Draft ID is missing, cannot upload video');
            return;
        }

        //console.log('Uploading video for draftId:', this.draftId);
        try {
            const path = await this.videoPostService.uploadVideo(file, this.draftId);
            this.videoPath = path;
            //console.log('Video uploaded, server path:', path);
        } catch (err) {
            //console.error('Error while uploading video:', err);
        }
    }

    private async handleThumbnailFile(file: File): Promise<void> {
        this.thumbnailFile = file;
        this.thumbnailError = '';

        if (this.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.thumbnailPreviewUrl);
        }
        this.thumbnailPreviewUrl = URL.createObjectURL(file);

        if (!this.draftId) {
            //console.error('Draft ID is missing, cannot upload thumbnail');
            return;
        }

        //console.log('Uploading thumbnail for draftId:', this.draftId);
        try {
            const path = await this.videoPostService.uploadThumbnail(file, this.draftId);
            this.thumbnailPath = path;
            //console.log('Thumbnail uploaded, server path:', path);
        } catch (err) {
            //console.error('Error while uploading thumbnail:', err);
        }
    }

    ngOnDestroy(): void {
        if (this.videoPreviewUrl) {
            URL.revokeObjectURL(this.videoPreviewUrl);
        }
        if (this.thumbnailPreviewUrl) {
            URL.revokeObjectURL(this.thumbnailPreviewUrl);
        }
    }

    ngOnInit(): void {
        this.initDraft();
    }

    private async initDraft(): Promise<void> {
        if (!this.draftId) {
            const draft = await this.videoPostService.startDraft();

            this.draftId = draft.draftId?.toString() ?? null;

            this.videoPath = draft.videoPath != null ? draft.videoPath.toString() : null;
            this.thumbnailPath = draft.thumbnailPath != null ? draft.thumbnailPath.toString() : null;

            console.log(this.videoPath);
            if (this.videoPath) {
                this.videoPreviewUrl = environment.mediaHost + this.videoPath;
            }
            if (this.thumbnailPath) {
                this.thumbnailPreviewUrl = environment.mediaHost + this.thumbnailPath;
            }

            
            const patch: { title?: string; description?: string } = {};
            if (draft.title != null) {
                patch.title = draft.title.toString();
            }
            if (draft.description != null) {
                patch.description = draft.description.toString();
            }
            if (Object.keys(patch).length > 0) {
                this.form.patchValue(patch);
            }
        }
    }
}
