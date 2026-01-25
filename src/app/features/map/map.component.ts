import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapTileService, MapTileVideo } from 'src/app/core/services/map-tile.service';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, OnDestroy {
    private map: L.Map | null = null;
    videos: MapTileVideo[] = [];
    loading = true;
    private markers: L.Marker[] = [];
    private updateTimeout: any;

    constructor(
        private mapTileService: MapTileService,
        private videoPostService: VideoPostService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initMap();
    }

    ngOnDestroy(): void {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    private loadVideosForCurrentView(): void {
        if (!this.map) return;
        this.loading = true;
        // Dobavi trenutne tile bounds
        const tileBounds = this.getTileBounds();
        console.log('Tile params:', tileBounds);
        // Učitaj videe za trenutne tiles
        this.mapTileService.getVideosForTiles(
            tileBounds.zoom,
            tileBounds.minTileX,
            tileBounds.maxTileX,
            tileBounds.minTileY,
            tileBounds.maxTileY
        ).subscribe({
            next: (videos) => {
                console.log('Broj videa:', videos.length);
                this.videos = videos;
                this.loading = false;
                this.clearMarkers();
                this.addVideoMarkers();
            },
            error: (error) => {
                console.error('Greška pri učitavanju videa:', error);
                this.loading = false;
            }
        });
    }

    private getTileBounds(): { zoom: number, minTileX: number, maxTileX: number, minTileY: number, maxTileY: number } {
        if (!this.map) {
            return { zoom: 5, minTileX: 0, maxTileX: 0, minTileY: 0, maxTileY: 0 };
        }

        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();

        // Pretvori geografske koordinate u tile koordinate
        const minTileX = this.lonToTileX(bounds.getWest(), zoom);
        const maxTileX = this.lonToTileX(bounds.getEast(), zoom);
        const minTileY = this.latToTileY(bounds.getNorth(), zoom);
        const maxTileY = this.latToTileY(bounds.getSouth(), zoom);

        return {
            zoom: Math.floor(zoom),
            minTileX: Math.floor(minTileX),
            maxTileX: Math.floor(maxTileX),
            minTileY: Math.floor(minTileY),
            maxTileY: Math.floor(maxTileY)
        };
    }

    private lonToTileX(lon: number, zoom: number): number {
        return ((lon + 180) / 360) * Math.pow(2, zoom);
    }

    private latToTileY(lat: number, zoom: number): number {
        return ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * Math.pow(2, zoom);
    }

    private clearMarkers(): void {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    private onMapMoveEnd(): void {
        // Debounce - čekaj 300ms pre nego što učitaš nove videe
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.loadVideosForCurrentView();
        }, 300);
    }

    private initMap(): void {
        // Inicijalizuj mapu centriranu na Evropu
        this.map = L.map('map-view').setView([48.8566, 2.3522], 5);

        // Dodaj tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(this.map);

        // Event listeneri za promene na mapi
        this.map.on('moveend', () => this.onMapMoveEnd());
        this.map.on('zoomend', () => this.onMapMoveEnd());

        // Učitaj videe za početni pogled
        this.loadVideosForCurrentView();
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

                // Dodaj marker u listu za kasniju cleanup
                this.markers.push(marker);

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
    }
}
