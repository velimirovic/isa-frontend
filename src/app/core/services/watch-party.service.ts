import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from 'src/env/environment';
import { WatchPartyRoomDTO } from '../models/watch-party-room.model';
import { WatchPartyPlayMessage } from '../models/watch-party-play-message.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WatchPartyService {
  private stompClient: Client | null = null;
  private connected = false;
  public playMessages$ = new Subject<WatchPartyPlayMessage>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createRoom(): Observable<WatchPartyRoomDTO> {
    return this.http.post<WatchPartyRoomDTO>(`${environment.apiHost}watch-party/create`, {});
  }

  getRoom(roomCode: string): Observable<WatchPartyRoomDTO> {
    return this.http.get<WatchPartyRoomDTO>(`${environment.apiHost}watch-party/${roomCode}`);
  }

  closeRoom(roomCode: string): Observable<string> {
    return this.http.post(`${environment.apiHost}watch-party/${roomCode}/close`, {}, { responseType: 'text' });
  }

  connect(roomCode: string, onConnected?: () => void): void {
    this.disconnect();
    const token = this.authService.getToken();
    const baseUrl = environment.apiHost.replace(/\/api\/$/, '');
    const wsUrl = `${baseUrl}/video-chat`;

    this.stompClient = new Client({
      webSocketFactory: () => {
        const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
        return new SockJS(url) as any;
      },
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        this.stompClient?.subscribe(`/topic/watch-party/${roomCode}`, (message: IMessage) => {
          const payload: WatchPartyPlayMessage = JSON.parse(message.body);
          this.playMessages$.next(payload);
        });
        if (onConnected) {
          onConnected();
        }
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      }
    });

    this.stompClient.activate();
  }

  play(roomCode: string, message: WatchPartyPlayMessage): void {
    if (this.connected && this.stompClient?.connected) {
      this.stompClient.publish({
        destination: `/app/watch-party/${roomCode}/play`,
        body: JSON.stringify(message)
      });
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connected = false;
    }
  }
}
