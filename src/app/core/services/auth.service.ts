import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080';
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly EXPIRATION_KEY = 'token_expiration';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Proveri token pri inicijalizaciji
    this.checkTokenExpiration();
  }

  register(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.API_URL}/auth/register`, request, {
      responseType: 'text'
    });
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, request)
      .pipe(
        tap(response => {
          this.saveToken(response.accessToken, response.expiresIn);
          this.isAuthenticatedSubject.next(true);
          this.scheduleTokenRefresh(response.expiresIn);
        })
      );
  }

  activate(token: string): Observable<string> {
    return this.http.get(`${this.API_URL}/auth/activate?token=${token}`, {
      responseType: 'text'
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRATION_KEY);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  private saveToken(token: string, expiresIn: number): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const expirationTime = new Date().getTime() + expiresIn;
    localStorage.setItem(this.EXPIRATION_KEY, expirationTime.toString());
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const expiration = localStorage.getItem(this.EXPIRATION_KEY);
    
    if (!token || !expiration) {
      return false;
    }
    
    const expirationTime = parseInt(expiration, 10);
    const now = new Date().getTime();
    
    return now < expirationTime;
  }

  private checkTokenExpiration(): void {
    setInterval(() => {
      if (!this.hasValidToken() && this.isAuthenticatedSubject.value) {
        this.logout();
        alert('Vaša sesija je istekla. Molimo prijavite se ponovo.');
      }
    }, 60000); // Proveri svaki minut
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    // Upozori korisnika 5 minuta pre isteka
    const warningTime = expiresIn - (5 * 60 * 1000);
    
    if (warningTime > 0) {
      setTimeout(() => {
        if (confirm('Vaša sesija uskoro ističe. Želite li da ostanete prijavljeni?')) {
          // Korisnik može da se ponovo uloguje
          this.router.navigate(['/login']);
        }
      }, warningTime);
    }
  }
}
