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
    
  videos: VideoResponseDTO[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private videoPostService: VideoPostService
  ) {}

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.videoPostService.getAllVideoPosts(this.page).subscribe({
        next: (videos) => {
        this.videos = videos;
        },
        error: (err) => {
        console.error('Greška pri učitavanju videa', err);
        }
    });
  }

  getDaysAgo(createdAt: string | Date): String {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return ""; // fallback ako backend vrati nešto čudno
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= 0 ? "Danas" : "Pre " + diffDays + " dana";
  }

  imageBaseUrl = 'http://localhost:8080/';

    getThumbnailUrl(path: String): String {
        return this.videoPostService.getThumbnailUrl(path);
    }
}