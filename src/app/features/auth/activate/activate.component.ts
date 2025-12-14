import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit {
  loading = true;
  success = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Preuzmi token iz URL-a
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.loading = false;
      this.errorMessage = 'Token za aktivaciju nije pronađen.';
      return;
    }

    // Pozovi backend za aktivaciju
    this.authService.activate(token).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error || 'Došlo je do greške pri aktivaciji naloga.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
