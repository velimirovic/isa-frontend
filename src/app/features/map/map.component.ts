import { Component, OnInit, OnDestroy } from '@angular/core';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
    private map: L.Map | null = null;
    videos: VideoResponseDTO[] = [];
    loading = true;

    constructor(
        private videoPostService: VideoPostService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadVideosWithLocation();
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    private async loadVideosWithLocation(): Promise<void> {
        try {
            this.loading = true;
            // Učitaj sve videe koristeći Observable
            this.videoPostService.getAllVideoPosts(0).subscribe({
                next: (allVideos: VideoResponseDTO[]) => {
                    // Filtriraj samo videe koji imaju validne koordinate (ne null i ne 0,0)
                    this.videos = allVideos.filter((v: VideoResponseDTO) => 
                        v.latitude != null && 
                        v.longitude != null && 
                        (v.latitude !== 0 || v.longitude !== 0)
                    );
                    this.loading = false;
                    // Ako je mapa već inicijalizovana, dodaj markere
                    if (this.map) {
                        this.addVideoMarkers();
                    }
                },
                error: (error: any) => {
                    console.error('Greška pri učitavanju videa:', error);
                    this.loading = false;
                }
            });
        } catch (error) {
            console.error('Greška pri učitavanju videa:', error);
            this.loading = false;
        }
    }

    private initMap(): void {
        // Inicijalizuj mapu centriranu na Evropu
        this.map = L.map('map-view').setView([48.8566, 2.3522], 5);

        // Dodaj tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(this.map);

        // Dodaj markere za svaki video
        this.addVideoMarkers();
    }

    private addVideoMarkers(): void {
        if (!this.map) return;

        const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        this.videos.forEach(video => {
            if (video.latitude != null && video.longitude != null && this.map) {
                const marker = L.marker([video.latitude, video.longitude], { icon })
                    .addTo(this.map);

                // URL za thumbnail
                const thumbnailUrl = this.videoPostService.getThumbnailUrl(video.thumbnailPath);

                // Kreiraj popup sa informacijama o videu
                const popupContent = `
                    <div style="min-width: 220px;">
                        <img src="${thumbnailUrl}" alt="${video.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />
                        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${video.title}</h3>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                            <strong>Autor:</strong> ${video.authorUsername}
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
                            <strong>Pregledi:</strong> ${video.viewCount}
                        </p>
                        <button 
                            onclick="window.location.href='/watch/${video.draftId}'" 
                            style="
                                width: 100%;
                                padding: 6px 12px;
                                background: #3cd9a7;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 600;
                                cursor: pointer;
                            "
                        >
                            Pogledaj video
                        </button>
                    </div>
                `;

                marker.bindPopup(popupContent);
            }
        });

        // Ako ima videa, centri mapu na prvi video
        if (this.videos.length > 0 && this.videos[0].latitude && this.videos[0].longitude) {
            this.map.setView([this.videos[0].latitude, this.videos[0].longitude], 6);
        }
    }
}
