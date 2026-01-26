import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { User } from 'src/app/core/models/user.model';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { environment } from 'src/env/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  username: string | null = null;
  loading = true;
  error: string | null = null;
  videos: VideoResponseDTO[] = [];
  page: number = 0;
  pageSize: number = 12;
  loadingVideos: boolean = false;
  hasMore: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private videoPostService: VideoPostService
  ) {}

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username');
    if (this.username) {
      this.userService.getUserProfile(this.username).subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
          this.loadUserVideos();
        },
        error: (err) => {
          console.error('Error loading user profile:', err);
          if (err.status === 404) {
            this.error = `Korisnik "${this.username}" ne postoji.`;
          } else if (err.status === 401 || err.status === 403) {
            this.error = 'Nemate dozvolu za pristup ovom profilu.';
          } else {
            this.error = 'Greška pri učitavanju profila.';
          }
          this.loading = false;
        }
      });
    } else {
      this.error = 'Nepoznat korisnik.';
      this.loading = false;
    }
  }

  loadUserVideos(): void {
    if (!this.username || this.loadingVideos || !this.hasMore) return;

    this.loadingVideos = true;
    this.videoPostService.getUserVideoPosts(this.username, this.page, this.pageSize).subscribe({
      next: (videos) => {
        if (videos.length === 0) {
          this.hasMore = false;
        } else {
          this.videos = [...this.videos, ...videos];
          this.page++;
        }
        this.loadingVideos = false;
      },
      error: (err) => {
        console.error('Greška pri učitavanju videa', err);
        // Ako je 401/403, ne pokušavaj više
        if (err.status === 401 || err.status === 403) {
          this.hasMore = false;
        }
        this.loadingVideos = false;
      }
    });
  }

  getThumbnailUrl(draftId: String): String {
    return environment.apiHost + 'video-posts/' + draftId + '/thumbnail';
  }

  getDaysAgo(createdAt: string | Date): String {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return '';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'Danas';
    } else if (diffDays === 1) {
      return 'Juče';
    } else if (diffDays < 7) {
      return 'Pre ' + diffDays + ' dana';
    } else {
      return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }
  }
}
