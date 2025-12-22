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
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.loading = false;
        
        // Parse error message from backend
        const errorText = typeof error.error === 'string' ? error.error : 
                         (error.error?.message || error.message || '');
        
        // Extract remaining attempts from error message
        const attemptsMatch = errorText.match(/Preostalo pokušaja:\s*(\d+)/i);
        if (attemptsMatch) {
          this.remainingAttempts = parseInt(attemptsMatch[1], 10);
        }

        // Handle specific error cases
        if (error.status === 401) {
          if (errorText?.includes('Pogrešan email') || 
              errorText?.includes('Incorrect email') ||
              errorText?.includes('Bad credentials')) {
            this.errorMessage = 'Pogrešan email ili lozinka. Molimo pokušajte ponovo.';
          } else if (errorText?.includes('Nalog nije aktiviran') || 
                     errorText?.includes('Account not activated')) {
            this.errorMessage = 'Nalog nije aktiviran. Proverite email za aktivacioni link.';
          } else {
            this.errorMessage = errorText || 'Neispravni pristupni podaci.';
          }
        } else if (error.status === 403) {
          this.errorMessage = 'Pristup odbijen. Morate aktivirati nalog pre prijavljivanja.';
        } else if (error.status === 429) {
          this.errorMessage = 'Previše pokušaja prijavljivanja. Nalog je privremeno zaključan. Pokušajte ponovo kasnije.';
          this.remainingAttempts = 0;
        } else if (error.status === 423) {
          this.errorMessage = 'Nalog je zaključan zbog previše neuspešnih pokušaja. Pokušajte ponovo za 1 minut.';
          this.remainingAttempts = 0;
        } else if (error.status === 400) {
          this.errorMessage = 'Neispravni podaci. Proverite email i lozinku.';
        } else if (error.status === 500) {
          this.errorMessage = 'Serverska greška. Molimo pokušajte kasnije.';
        } else if (error.status === 0) {
          this.errorMessage = 'Nema konekcije sa serverom. Proverite internet konekciju.';
        } else {
          this.errorMessage = errorText || 'Došlo je do neočekivane greške pri prijavljivanju.';
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
