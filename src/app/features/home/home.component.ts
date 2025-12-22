import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface Video {
  id: number;
  title: string;
  views: string;
  date: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  username: string = '';
  isLoggedIn: boolean = false;
  private authSubscription?: Subscription;
  
  // Mock video data
  videos: Video[] = [
    { id: 1, title: 'Video snimak 1', views: '1.2K', date: 'Pre 2 dana' },
    { id: 2, title: 'Video snimak 2', views: '856', date: 'Pre 3 dana' },
    { id: 3, title: 'Video snimak 3', views: '2.4K', date: 'Pre 5 dana' },
    { id: 4, title: 'Video snimak 4', views: '3.1K', date: 'Pre 1 nedelju' },
    { id: 5, title: 'Video snimak 5', views: '945', date: 'Pre 2 nedelje' },
    { id: 6, title: 'Video snimak 6', views: '1.8K', date: 'Pre 2 nedelje' },
    { id: 7, title: 'Video snimak 7', views: '4.2K', date: 'Pre 3 nedelje' },
    { id: 8, title: 'Video snimak 8', views: '1.5K', date: 'Pre 1 mesec' },
    { id: 9, title: 'Video snimak 9', views: '2.7K', date: 'Pre 1 mesec' },
    { id: 10, title: 'Video snimak 10', views: '892', date: 'Pre 1 mesec' },
    { id: 11, title: 'Video snimak 11', views: '3.5K', date: 'Pre 2 meseca' },
    { id: 12, title: 'Video snimak 12', views: '1.1K', date: 'Pre 2 meseca' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication status changes
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuthenticated => {
        this.isLoggedIn = isAuthenticated;
        
        if (isAuthenticated) {
          const token = this.authService.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              // Token sadrži sub (email), prikaži ga kao username
              this.username = payload.sub || '';
            } catch (e) {
              console.error('Error parsing token', e);
            }
          }
        } else {
          this.username = '';
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  logout(): void {
    if (confirm('Da li ste sigurni da želite da se odjavite?')) {
      this.authService.logout();
    }
  }
}