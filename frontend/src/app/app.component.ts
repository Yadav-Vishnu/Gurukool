import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterOutlet],
  template: `
    <ion-app>
      <router-outlet></router-outlet>
    </ion-app>
  `,
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  constructor() {
    void this.authService.ensureReady();
  }
}
