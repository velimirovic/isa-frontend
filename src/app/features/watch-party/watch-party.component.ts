import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WatchPartyService } from 'src/app/core/services/watch-party.service';
import { WatchPartyRoomDTO } from 'src/app/core/models/watch-party-room.model';
import { WatchPartyPlayMessage } from 'src/app/core/models/watch-party-play-message.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { FilterType } from 'src/app/core/models/filter-type.enum';

@Component({
  selector: 'app-watch-party',
  templateUrl: './watch-party.component.html',
  styleUrls: ['./watch-party.component.css']
})
export class WatchPartyComponent implements OnInit, OnDestroy {
  roomCode = '';
  joinCode = '';
  shareLink = '';
  joinStatus = 'Niste povezani.';
  hostStatus = 'Ceka se soba.';
  isHost = false;
  isConnected = false;
  connecting = false;
  userVideos: VideoResponseDTO[] = [];
  videosLoading = false;
  videosStatus = 'Ucitavanje videa...';
  selectedVideoId = '';
  selectedVideoTitle = '';
  private playSub: Subscription | null = null;

  constructor(
    private watchPartyService: WatchPartyService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private videoPostService: VideoPostService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const code = params.get('code');
      if (code) {
        this.joinCode = this.normalizeCode(code);
        this.joinRoom();
      }
    });

    this.route.queryParamMap.subscribe(params => {
      const code = params.get('room');
      if (code) {
        this.joinCode = this.normalizeCode(code);
        this.joinRoom();
      }
    });

    this.playSub = this.watchPartyService.playMessages$.subscribe(message => {
      this.handlePlayMessage(message);
    });

  }

  ngOnDestroy(): void {
    this.playSub?.unsubscribe();
    this.watchPartyService.disconnect();
  }

  createRoom(): void {
    this.watchPartyService.createRoom().subscribe({
      next: (room: WatchPartyRoomDTO) => {
        this.isHost = true;
        this.roomCode = room.roomCode;
        this.joinCode = room.roomCode;
        this.setShareLink(room.roomCode);
        this.connectToRoom(room.roomCode);
        this.loadUserVideos();
      },
      error: () => {
        this.hostStatus = 'Neuspesno kreiranje sobe. Proverite da li ste prijavljeni.';
      }
    });
  }

  joinRoom(): void {
    const code = this.normalizeCode(this.joinCode);
    if (!code) {
      this.joinStatus = 'Unesite kod sobe.';
      return;
    }

    this.watchPartyService.getRoom(code).subscribe({
      next: (room: WatchPartyRoomDTO) => {
        if (!room.active) {
          this.joinStatus = 'Soba je zatvorena.';
          return;
        }
        this.roomCode = room.roomCode;
        this.setShareLink(room.roomCode);
        this.connectToRoom(room.roomCode);
      },
      error: () => {
        this.joinStatus = 'Soba nije pronadjena.';
      }
    });
  }

  playVideo(): void {
    if (!this.roomCode) {
      this.hostStatus = 'Prvo kreirajte ili se pridruzite sobi.';
      return;
    }
    if (!this.selectedVideoId) {
      this.hostStatus = 'Izaberite video iz liste.';
      return;
    }

    const message: WatchPartyPlayMessage = {
      videoDraftId: this.selectedVideoId,
      videoTitle: this.selectedVideoTitle || 'Bez naziva',
      hostUsername: this.getHostLabel()
    };

    this.watchPartyService.play(this.roomCode, message);
    this.hostStatus = `Video poslat: ${message.videoTitle}.`;
  }

  closeRoom(): void {
    if (!this.roomCode) {
      this.hostStatus = 'Nema aktivne sobe.';
      return;
    }

    this.watchPartyService.closeRoom(this.roomCode).subscribe({
      next: () => {
        this.hostStatus = 'Soba je zatvorena.';
        this.joinStatus = 'Soba je zatvorena.';
        this.isConnected = false;
        this.isHost = false;
        this.watchPartyService.disconnect();
      },
      error: () => {
        this.hostStatus = 'Neuspesno zatvaranje sobe.';
      }
    });
  }

  useVideo(video: VideoResponseDTO): void {
    this.selectedVideoId = video.draftId?.toString() || '';
    this.selectedVideoTitle = video.title?.toString() || 'Bez naziva';
  }

  isSelected(video: VideoResponseDTO): boolean {
    return (video.draftId?.toString() || '') === this.selectedVideoId;
  }

  copyLink(): void {
    if (!this.shareLink) {
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.shareLink).then(() => {
        this.hostStatus = 'Link je kopiran.';
      }).catch(() => {
        this.hostStatus = 'Neuspesno kopiranje linka.';
      });
    } else {
      this.hostStatus = 'Vas browser ne podrzava kopiranje.';
    }
  }

  private loadUserVideos(): void {
    this.videosLoading = true;
    this.videosStatus = 'Ucitavanje...';

    this.videoPostService.getAllVideoPosts(0, 50, FilterType.ALL_TIME).subscribe({
      next: (videos) => {
        this.userVideos = videos || [];
        this.videosLoading = false;
        this.videosStatus = this.userVideos.length === 0
          ? 'Nema dostupnih videa.'
          : '';
      },
      error: () => {
        this.videosLoading = false;
        this.videosStatus = 'Neuspesno ucitavanje videa.';
      }
    });
  }

  private connectToRoom(code: string): void {
    this.connecting = true;
    this.joinStatus = `Povezivanje na sobu ${code}...`;
    this.watchPartyService.connect(code, () => {
      this.isConnected = true;
      this.connecting = false;
      this.joinStatus = `Povezani ste na sobu ${code}.`;
      this.hostStatus = this.isHost
        ? 'Soba je aktivna. Pokrenite video kada ste spremni.'
        : 'Ceka se da host pokrene video.';
    });
  }

  private handlePlayMessage(message: WatchPartyPlayMessage): void {
    if (!message || !message.videoDraftId) {
      return;
    }

    this.router.navigate(['/watch', message.videoDraftId]);
  }

  private setShareLink(code: string): void {
    if (typeof window !== 'undefined') {
      this.shareLink = `${window.location.origin}/watch-party/${code}`;
    } else {
      this.shareLink = '';
    }
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private getHostLabel(): string {
    const token = this.authService.getToken();
    if (!token) {
      return 'Host';
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username || payload.sub || 'Host';
    } catch {
      return 'Host';
    }
  }
}
