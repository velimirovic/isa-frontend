import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';
import { VideoPostService } from 'src/app/core/services/video-post.service';
import { VideoResponseDTO } from 'src/app/core/models/videopost.model';
import { FilterType } from 'src/app/core/models/filter-type.enum';

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
  selectedPeriod: 'all' | '30d' | 'year' = 'all';
  FilterType = FilterType;
    
  videos: VideoResponseDTO[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private videoPostService: VideoPostService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(filter: FilterType = FilterType.ALL_TIME): void {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    this.videoPostService.getAllVideoPosts(this.page, this.pageSize, filter).subscribe({
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
      return date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }
  }

  imageBaseUrl = 'http://localhost:8080/';

    getThumbnailUrl(draftId: String): String {
        return this.imageBaseUrl + "api/video-posts/" + draftId + "/thumbnail";
    }

    setFilter(filter: FilterType): void {
        this.page = 0;
        this.hasMore = true;
        this.videos = [];
        this.loadVideos(filter);
    }

    isScheduled(video: VideoResponseDTO): boolean {
        if (!video.scheduledDateTime) return false;
        const scheduled = new Date(video.scheduledDateTime);
        const now = new Date();
        
        const isScheduledForFuture = now < scheduled;
        
        if (isScheduledForFuture) {
            console.log('[BADGE] Zakazano:', video.title, 
                       '| Scheduled:', scheduled.toLocaleString('sr-Latn-RS'), 
                       '| Now:', now.toLocaleString('sr-Latn-RS'));
        }
        
        return isScheduledForFuture;
    }

    isLiveNow(video: VideoResponseDTO): boolean {
        if (!video.scheduledDateTime) return false;
        
        const scheduled = new Date(video.scheduledDateTime);
        const now = new Date();
        
        // Video hasn't started yet
        if (now < scheduled) return false;
        
        // If duration is not set, assume a default duration of 3 hours (10800 seconds)
        // This is for backward compatibility with videos uploaded before duration tracking
        const durationSeconds = video.durationSeconds || 10800;
        
        // Calculate elapsed seconds since scheduled time
        const elapsedSeconds = (now.getTime() - scheduled.getTime()) / 1000;
        
        const isCurrentlyLive = elapsedSeconds < durationSeconds;
        
        if (isCurrentlyLive) {
            console.log('[BADGE] UŽIVO:', video.title, 
                       '| Started:', scheduled.toLocaleString('sr-Latn-RS'),
                       '| Elapsed:', Math.floor(elapsedSeconds), 's',
                       '| Duration:', durationSeconds, 's');
        }
        
        return isCurrentlyLive;
    }

    getScheduledDateTime(video: VideoResponseDTO): string {
        if (!video.scheduledDateTime) return '';
        const date = new Date(video.scheduledDateTime);
        const dateStr = date.toLocaleDateString('sr-Latn-RS', { 
            day: 'numeric', 
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
        return dateStr;
    }
}