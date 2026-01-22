import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Subscription } from 'rxjs';
import { ModalService } from './shared/modal/modal.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'jutjubic-frontend';
  username: string = '';
  isLoggedIn: boolean = false;
  private authSubscription?: Subscription;


  constructor (
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  async logout(): Promise<void> {
    const confirmed = await this.modalService.confirm(
      'Da li ste sigurni da želite da se odjavite?',
      'Odjava'
    );
    
    if (confirmed) {
      this.authService.logout();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

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
}