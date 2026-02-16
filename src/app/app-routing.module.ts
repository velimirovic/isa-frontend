import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ActivateComponent } from './features/auth/activate/activate.component';
import { CheckEmailComponent } from './features/auth/check-email/check-email.component';
import { AuthGuard } from './core/guards/auth.guard';
import { UploadComponent } from './features/upload/upload/upload.component';
import { VideoDetailsComponent } from './features/video-details/video-details.component';
import { ProfileComponent } from './features/profile/profile.component';
import { MapComponent } from './features/map/map.component';
import { WatchPartyComponent } from './features/watch-party/watch-party.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'activate', component: ActivateComponent },
  { path: 'check-email', component: CheckEmailComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
  { path: 'map', component: MapComponent, canActivate: [AuthGuard] },
  { path: 'watch/:id', component: VideoDetailsComponent },
  { path: 'watch-party', component: WatchPartyComponent },
  { path: 'watch-party/:code', component: WatchPartyComponent },
  { path: 'profile/:username', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
