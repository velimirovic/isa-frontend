import { environment } from "src/env/environment";
import { VideoPostDraftDTO, VideoResponseDTO } from "../models/videopost.model";
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { Injectable } from '@angular/core';
import { AuthService } from "./auth.service";
import { Subscription } from "rxjs";
import { FilterType } from "../models/filter-type.enum";

export interface LikeResponseDTO {
    likeCount: number;
    likedByUser: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VideoPostService {
    private baseUrl = environment.apiHost+'video-posts';
    private interactionsUrl = environment.apiHost+'interactions';
    private authSubscription?: Subscription;


    constructor(
        private http: HttpClient,
        private authService: AuthService,
    ) {}

    getAllVideoPosts(page: number, pageSize: number = 3, filter: FilterType) : Observable<VideoResponseDTO[]> {
        return this.http.get<VideoResponseDTO[]>(this.baseUrl, { 
            params: { 
                page: page.toString(),
                size: pageSize.toString(),
                filter: filter
            } 
        });
    }

    async getAllVideos(): Promise<VideoResponseDTO[]> {
        const request$ = this.http.get<VideoResponseDTO[]>(this.baseUrl + '/all');
        return lastValueFrom(request$);
    }


    getUserVideoPosts(username: string, page: number = 0, pageSize: number = 12): Observable<VideoResponseDTO[]> {
        return this.http.get<VideoResponseDTO[]>(`${this.baseUrl}/user/${username}`, {
            params: {
                page: page.toString(),
                size: pageSize.toString()
            }
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

    async uploadPostDetails(
        title: string, 
        description: string, 
        tags: string[], 
        draftId: string,
        latitude: number | null = null,
        longitude: number | null = null,
        scheduledDateTime: Date | null = null,
        durationSeconds: number | null = null
    ): Promise<string> {
        const body: any = { title, description, tags };
        
        // Dodaj latitude i longitude samo ako su postavljeni
        if (latitude !== null && longitude !== null) {
            body.latitude = latitude;
            body.longitude = longitude;
        }
        
        // Dodaj scheduledDateTime samo ako je postavljen
        if (scheduledDateTime !== null) {
            // Format date as local time string in ISO format (without timezone)
            const year = scheduledDateTime.getFullYear();
            const month = String(scheduledDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(scheduledDateTime.getDate()).padStart(2, '0');
            const hours = String(scheduledDateTime.getHours()).padStart(2, '0');
            const minutes = String(scheduledDateTime.getMinutes()).padStart(2, '0');
            const seconds = String(scheduledDateTime.getSeconds()).padStart(2, '0');
            
            body.scheduledDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            console.log('=== VIDEO POST SERVICE ===');
            console.log('Sending scheduledDateTime (local time):', body.scheduledDateTime);
        }
        
        // Dodaj durationSeconds ako je postavljen
        if (durationSeconds !== null) {
            body.durationSeconds = durationSeconds;
            console.log('Sending durationSeconds:', durationSeconds);
        }
        
        console.log('=== UPLOAD POST DETAILS BODY ===');
        console.log(JSON.stringify(body, null, 2));
        
        const request$ = this.http.patch(
            this.baseUrl + '/' + draftId,
            body,
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

    async getVideoDetails(draftId: string) : Promise<VideoResponseDTO> {
        const request$ = this.http.get<VideoResponseDTO>(
            this.baseUrl + '/' + draftId,            
        )

        return lastValueFrom(request$);
    }

    // Like metode
    toggleLike(videoId: number): Observable<LikeResponseDTO> {
        return this.http.post<LikeResponseDTO>(
            `${this.interactionsUrl}/videos/${videoId}/like`,
            null
        );
    }

    getLikeStatus(videoId: number): Observable<LikeResponseDTO> {
        return this.http.get<LikeResponseDTO>(
            `${this.interactionsUrl}/videos/${videoId}/likes`
        );
    }

    async getPlaybackOffset(draftId: string): Promise<number> {
        console.log('Fetching playback offset for draftId:', draftId);
        const request$ = this.http.get<number>(
            this.baseUrl + '/' + draftId + '/playback-offset'
        );
        const offset = await lastValueFrom(request$);
        console.log('Playback offset received:', offset);
        return offset;
    }
}