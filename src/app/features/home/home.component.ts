import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';

interface Video {
  id: number;
  title: string;
  views: string;
  date: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  username: string = '';
  isLoggedIn: boolean = false;
  private authSubscription?: Subscription;
  page: number = 0;
  pageSize: number = 12; // 3 reda po 4 videa
  loading: boolean = false;
  hasMore: boolean = true;
    
  videos: VideoResponseDTO[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private videoPostService: VideoPostService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
    this.setupScrollListener();
  }

  loadVideos(): void {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    this.videoPostService.getAllVideoPosts(this.page, this.pageSize).subscribe({
        next: (videos) => {
          if (videos.length === 0) {
            this.hasMore = false;
          } else {
            this.videos = [...this.videos, ...videos];
            this.page++;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Greška pri učitavanju videa', err);
          this.loading = false;
        }
    });
  }

  setupScrollListener(): void {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Ako je korisnik skrolovao do 80% stranice, učitaj još
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        this.loadVideos();
      }
    });
  }

  getDaysAgo(createdAt: string | Date): String {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Danas";
    } else if (diffDays === 1) {
      return "Juče";
    } else if (diffDays < 7) {
      return "Pre " + diffDays + " dana";
    } else {
      return date.toLocaleDateString('sr-RS', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }
  }

  imageBaseUrl = 'http://localhost:8080/';

    getThumbnailUrl(draftId: String): String {
        return this.imageBaseUrl + "api/video-posts/" + draftId + "/thumbnail";
    }
}