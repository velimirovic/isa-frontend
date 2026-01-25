import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MapTileVideo {
  id: number;
  title: string;
  draftId: string;
  latitude: number;
  longitude: number;
  thumbnailPath: string;
  viewCount: number;
  authorUsername: string;
}

@Injectable({ providedIn: 'root' })
export class MapTileService {
  constructor(private http: HttpClient) {}

  getVideosForTiles(
    zoom: number,
    minTileX: number,
    maxTileX: number,
    minTileY: number,
    maxTileY: number
  ): Observable<MapTileVideo[]> {
    let params = new HttpParams()
      .set('zoom', zoom)
      .set('minTileX', minTileX)
      .set('maxTileX', maxTileX)
      .set('minTileY', minTileY)
      .set('maxTileY', maxTileY);
    return this.http.get<MapTileVideo[]>(
      '/api/map/tiles',
      { params }
    );
  }
}