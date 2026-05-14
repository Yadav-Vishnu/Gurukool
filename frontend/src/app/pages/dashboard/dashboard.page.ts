import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SessionRecord } from '../../core/models/auth.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, IonicModule],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-title>Gurukool Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="refresh()">Refresh</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <div class="page-shell stack dashboard-shell">
        <ion-card class="glass-card profile-card">
          <ion-card-content class="stack">
            <span class="section-kicker">Signed In</span>
            <h1>{{ firstName() }}, your Gurukool core setup is ready.</h1>
            <p class="muted-copy">
              This starter dashboard proves the whole Phase 1 loop works: frontend routing, secure
              auth, PostgreSQL users, Redis-backed sessions, and protected API access.
            </p>

            <div class="stat-grid">
              <div class="stat-tile">
                <span>Auth method</span>
                <strong>{{ user()?.auth_provider === 'google' ? 'Google OAuth' : 'Mobile OTP' }}</strong>
              </div>
              <div class="stat-tile">
                <span>Verification</span>
                <strong>{{ user()?.is_verified ? 'Verified' : 'Pending' }}</strong>
              </div>
              <div class="stat-tile">
                <span>Role</span>
                <strong>{{ user()?.role | titlecase }}</strong>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-note color="danger" *ngIf="errorMessage()">
          {{ errorMessage() }}
        </ion-note>

        <ion-card class="glass-card">
          <ion-card-header>
            <ion-card-title>Study Workspace</ion-card-title>
            <ion-card-subtitle>
              Open the test engine or build your offline-ready Books & Notes notebook.
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="stack">
            <div class="actions actions-wide">
              <ion-button routerLink="/tests" expand="block">
                Open Test Engine
              </ion-button>
              <ion-button routerLink="/books" fill="outline" color="secondary" expand="block">
                Open Books & Notes
              </ion-button>
              <ion-button routerLink="/community" fill="outline" color="tertiary" expand="block">
                Open Community
              </ion-button>
              <ion-button routerLink="/engagement" fill="outline" color="success" expand="block">
                Open Engagement
              </ion-button>
              <ion-button routerLink="/growth" fill="outline" color="warning" expand="block">
                Open Growth
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="glass-card">
          <ion-card-header>
            <ion-card-title>Profile Snapshot</ion-card-title>
          </ion-card-header>
          <ion-card-content class="stack">
            <ion-item lines="none">
              <ion-label>
                <h3>Full name</h3>
                <p>{{ user()?.full_name || 'Gurukool User' }}</p>
              </ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-label>
                <h3>Email</h3>
                <p>{{ user()?.email || 'Not connected yet' }}</p>
              </ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-label>
                <h3>Phone</h3>
                <p>{{ user()?.phone || 'Not added yet' }}</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <ion-card class="glass-card">
          <ion-card-header>
            <ion-card-title>Session Security</ion-card-title>
            <ion-card-subtitle>
              If the same student signs in on another device, this session will be invalidated.
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content class="stack">
            <ion-list lines="none">
              <ion-item *ngFor="let session of sessions()">
                <ion-label>
                  <h3>{{ session.device_info.os || 'Unknown device' }}</h3>
                  <p>{{ session.device_info.browser }}</p>
                  <p>Last active: {{ formatDate(session.last_active_at) }}</p>
                </ion-label>
                <ion-badge slot="end" color="success" *ngIf="session.is_active">Active</ion-badge>
              </ion-item>
            </ion-list>

            <div class="actions">
              <ion-button fill="outline" color="medium" (click)="logoutAll()">
                Logout all devices
              </ion-button>
              <ion-button color="primary" (click)="logout()">
                Logout here
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .dashboard-shell {
      padding-top: 88px;
    }

    .profile-card {
      overflow: hidden;
      position: relative;
    }

    .profile-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(244, 109, 67, 0.14), transparent 45%),
        linear-gradient(225deg, rgba(30, 136, 229, 0.12), transparent 42%);
      pointer-events: none;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--ion-color-dark);
    }

    .stat-grid {
      display: grid;
      gap: 12px;
    }

    .stat-tile {
      padding: 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid var(--gk-outline);
    }

    .stat-tile span {
      display: block;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--gk-muted);
    }

    .stat-tile strong {
      display: block;
      margin-top: 6px;
      font-size: 1.05rem;
      color: var(--ion-color-dark);
    }

    .actions {
      display: grid;
      gap: 12px;
    }

    .actions-wide {
      grid-template-columns: 1fr;
    }

    ion-item {
      --background: rgba(248, 250, 255, 0.72);
      --border-radius: 18px;
      margin-bottom: 12px;
      border: 1px solid var(--gk-outline);
    }

    @media (min-width: 768px) {
      .stat-grid,
      .actions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .actions {
        grid-template-columns: repeat(2, minmax(0, 220px));
        justify-content: flex-end;
      }

      .actions-wide {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        justify-content: stretch;
      }
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly sessions = this.authService.sessions;
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.errorMessage.set(null);

    try {
      await this.authService.loadProfile();
      await this.authService.loadSessions();
    } catch (error) {
      this.errorMessage.set(
        this.authService.readError(error, 'We could not refresh the dashboard data.')
      );
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  async logoutAll(): Promise<void> {
    await this.authService.logoutAll();
  }

  firstName(): string {
    const fullName = this.user()?.full_name?.trim();
    if (!fullName) {
      return 'Student';
    }

    return fullName.split(' ')[0];
  }

  formatDate(value: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  trackSession(_index: number, session: SessionRecord): string {
    return session.id;
  }
}
