import { environment } from "src/env/environment";
import { VideoPostDraftDTO, VideoResponseDTO } from "../models/videopost.model";
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from "./auth.service";
import { Subscription } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class VideoPostService {
    private baseUrl = environment.apiHost+'video-posts';
    private authSubscription?: Subscription;


    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAllVideoPosts(page: number) : Observable<VideoResponseDTO[]> {
        return this.http.get<VideoResponseDTO[]>(this.baseUrl, { 
            params: { page: page } 
        });
    }

    getThumbnailUrl(path: String): String {
        return environment.mediaHost + path;
    }

    async startDraft(): Promise<VideoPostDraftDTO> {
        const token = this.authService.getToken();
        if (!token) {
            throw new Error('Nema tokena – korisnik nije ulogovan');
        }

        let email = '';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            email = payload.sub || '';
        } catch (e) {
            console.error('Error parsing token', e);
            throw e;
        }

        const request$ = this.http.post<VideoPostDraftDTO>(
            this.baseUrl + '/draft',
            null,
            {
                params: { authorEmail: email },
            }
        );

        return lastValueFrom(request$);
    }

    async uploadVideo(file: File, draftId: string) : Promise<string> {
        const formData = new FormData();
        formData.append('video', file);
        
        const request$ = this.http.post(
            this.baseUrl + '/' + draftId + '/video',
            formData,
            {
                responseType: 'text', 
            }
        );
        return lastValueFrom(request$);
    }

    async uploadThumbnail(file: File, draftId: string) : Promise<string> {
        const formData = new FormData();
        formData.append('thumbnail', file);

        const request$ = this.http.post(
            this.baseUrl + '/' + draftId + '/thumbnail',
            formData,
            {
                responseType: 'text',
            }
        );
        return lastValueFrom(request$);
    }

    async uploadPostDetails(title: string, description: string, draftId : string) : Promise<string> {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        
        const request$ = this.http.patch(
            this.baseUrl + '/' + draftId,
            formData,
            {
                responseType: 'text',
            }
        );
        return lastValueFrom(request$);
    }

    async publishVideoPost(draftId : string) : Promise<VideoResponseDTO> {
        const request$ = this.http.post<VideoResponseDTO>(
            this.baseUrl + '/' + draftId + '/publish',
            null,
        );

        return lastValueFrom(request$);
    }
}