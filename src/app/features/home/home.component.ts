import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Preuzmi email iz tokena (možeš dekodirati JWT)
    const token = this.authService.getToken();
    if (token) {
      // Jednostavno dekodiranje JWT-a (samo za prikaz, ne validaciju!)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userEmail = payload.sub || '';
      } catch (e) {
        console.error('Error parsing token', e);
      }
    }
  }

  logout(): void {
    if (confirm('Da li ste sigurni da želite da se odjavite?')) {
      this.authService.logout();
    }
  }
}