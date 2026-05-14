import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="page-shell callback-shell">
        <ion-card class="glass-card callback-card">
          <ion-card-content class="stack ion-text-center">
            <ion-spinner name="crescent"></ion-spinner>
            <h2>{{ title() }}</h2>
            <p class="muted-copy">{{ subtitle() }}</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .callback-shell {
      display: grid;
      place-items: center;
      min-height: 100%;
    }

    .callback-card {
      width: min(100%, 460px);
      margin: 0;
      padding: 12px 8px;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--ion-color-dark);
    }

    ion-spinner {
      width: 36px;
      height: 36px;
      margin: 0 auto 8px;
    }
  `],
})
export class OauthCallbackPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly title = signal('Finishing your Google sign-in');
  readonly subtitle = signal('We are securing your session and loading your dashboard.');

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.completeGoogleLogin(window.location.hash);
      window.location.hash = '';
      await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error) {
      this.title.set('Google sign-in could not be completed');
      this.subtitle.set(
        this.authService.readError(error, 'Please return to the login screen and try again.')
      );

      window.location.hash = '';

      setTimeout(() => {
        void this.router.navigateByUrl('/auth', { replaceUrl: true });
      }, 1400);
    }
  }
}
