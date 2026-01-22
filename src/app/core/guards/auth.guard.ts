import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../../shared/modal/modal.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    
    this.modalService.show('Morate biti ulogovani da biste pristupili ovoj stranici.', 'Pristup odbijen');
    this.router.navigate(['/login']);
    return false;
  }
}
