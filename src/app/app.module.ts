import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ActivateComponent } from './features/auth/activate/activate.component';
import { CheckEmailComponent } from './features/auth/check-email/check-email.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { UploadComponent } from './features/upload/upload/upload.component';
import { MatIconModule } from '@angular/material/icon';
import { VideoDetailsComponent } from './features/video-details/video-details.component';
import { ProfileComponent } from './features/profile/profile.component';
import { MapComponent } from './features/map/map.component';
import { ModalComponent } from './shared/modal/modal.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RegisterComponent,
    LoginComponent,
    ActivateComponent,
    CheckEmailComponent,
    NavbarComponent,
    UploadComponent,
    VideoDetailsComponent,
    ProfileComponent,
    MapComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    MatIconModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }