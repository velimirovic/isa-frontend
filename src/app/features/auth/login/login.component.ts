import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  remainingAttempts: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.remainingAttempts = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.loading = false;
        
        // Izvuci broj preostalih pokušaja iz poruke
        const errorText = error.error || error.message || 'Došlo je do greške pri prijavljivanju.';
        this.errorMessage = errorText;
        
        const match = errorText.match(/Preostalo pokušaja:\s*(\d+)/);
        if (match) {
          this.remainingAttempts = parseInt(match[1], 10);
        }

        // Specifične poruke za različite greške
        if (error.status === 429) {
          this.errorMessage = 'Previše pokušaja prijavljivanja. Pokušajte ponovo za 1 minut.';
        } else if (error.status === 403) {
          this.errorMessage = 'Morate aktivirati nalog pre prijavljivanja. Proverite email.';
        }
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return field === 'email' ? 'Email je obavezan' : 'Lozinka je obavezna';
    }
    if (control.hasError('email')) {
      return 'Email mora biti validan';
    }

    return '';
  }
}
