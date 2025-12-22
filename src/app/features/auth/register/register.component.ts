import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      address: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response;
        setTimeout(() => {
          this.router.navigate(['/check-email']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        
        // Parse error message from backend
        let errorText = '';
        
        if (typeof error.error === 'string') {
          errorText = error.error;
        } else if (error.error?.message) {
          errorText = error.error.message;
        } else if (error.message) {
          errorText = error.message;
        }
        
        // Handle specific error cases based on status code first
        if (error.status === 401) {
          // 401 usually means duplicate username or email
          this.errorMessage = 'Korisničko ime ili email već postoji. Molimo izaberite drugo.';
        } else if (error.status === 400) {
          this.errorMessage = 'Neispravni podaci. Molimo proverite sve unose i pokušajte ponovo.';
        } else if (error.status === 500) {
          this.errorMessage = 'Serverska greška. Molimo pokušajte kasnije.';
        } else if (error.status === 0) {
          this.errorMessage = 'Nema konekcije sa serverom. Proverite internet konekciju.';
        } else if (errorText) {
          // Try to parse specific error messages from text
          if (errorText.includes('Korisnicko ime vec postoji') || 
              errorText.includes('Username already exists')) {
            this.errorMessage = 'Korisničko ime već postoji. Molimo izaberite drugo korisničko ime.';
          } else if (errorText.includes('Email vec postoji') || 
                     errorText.includes('Email already exists')) {
            this.errorMessage = 'Email adresa je već registrovana. Molimo koristite drugu email adresu.';
          } else if (errorText.includes('Lozinke se ne poklapaju') || 
                     errorText.includes('Passwords do not match')) {
            this.errorMessage = 'Lozinke se ne poklapaju.';
          } else if (errorText.includes('Nevalidna email adresa') || 
                     errorText.includes('Invalid email')) {
            this.errorMessage = 'Email adresa nije validna.';
          } else if (errorText.includes('Lozinka mora biti najmanje') || 
                     errorText.includes('Password must be at least')) {
            this.errorMessage = 'Lozinka mora imati najmanje 6 karaktera.';
          } else {
            this.errorMessage = 'Došlo je do greške pri registraciji. Molimo pokušajte ponovo.';
          }
        } else {
          this.errorMessage = 'Došlo je do neočekivane greške. Molimo pokušajte ponovo.';
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
    const control = this.registerForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return `${this.getFieldLabel(field)} je obavezno polje`;
    if (control.hasError('email')) return 'Email mora biti validan';
    if (control.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${this.getFieldLabel(field)} mora imati najmanje ${minLength} karaktera`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `${this.getFieldLabel(field)} može imati najviše ${maxLength} karaktera`;
    }

    return '';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      username: 'Korisničko ime',
      password: 'Lozinka',
      confirmPassword: 'Potvrda lozinke',
      firstName: 'Ime',
      lastName: 'Prezime',
      address: 'Adresa'
    };
    return labels[field] || field;
  }

  get passwordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') && 
           this.registerForm.get('confirmPassword')?.touched || false;
  }
}
