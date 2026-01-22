import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    // Dodaj token ako postoji
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Ako je 401, token je istekao ili je nevažeći
        // ALI ne izloguj korisnika ako je greška sa login/register/profile/video-posts endpointa
        if (error.status === 401) {
          const isAuthEndpoint = error.url?.includes('/auth/login') || 
                                 error.url?.includes('/auth/register') ||
                                 error.url?.includes('/users/') && error.url?.includes('/profile') ||
                                 error.url?.includes('/video-posts/user/');
          
          // Samo izloguj ako NIJE auth ili profile endpoint (znači da je token istekao)
          if (!isAuthEndpoint && token) {
            this.authService.logout();
          }
        }
        return throwError(() => error);
      })
    );
  }
}
