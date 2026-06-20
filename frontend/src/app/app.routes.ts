import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { WelcomePage } from './pages/welcome/welcome.page';
import { AuthPage } from './pages/auth/auth.page';
import { OauthCallbackPage } from './pages/auth/oauth-callback.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { CatalogPage } from './pages/tests/catalog.page';
import { AttemptPage } from './pages/tests/attempt.page';
import { AnalyticsPage } from './pages/tests/analytics.page';
import { BooksPage } from './pages/books/books.page';
import { CommunityPage } from './pages/community/community.page';
import { EngagementPage } from './pages/engagement/engagement.page';
import { ProfileSetupPage } from './pages/profile-setup/profile-setup.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'welcome',
  },
  {
    path: 'welcome',
    component: WelcomePage,
    canActivate: [guestGuard],
  },
  {
    path: 'auth',
    component: AuthPage,
    canActivate: [guestGuard],
  },
  {
    path: 'auth/oauth-callback',
    component: OauthCallbackPage,
  },
  {
    path: 'profile-setup',
    component: ProfileSetupPage,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: 'tests',
    component: CatalogPage,
    canActivate: [authGuard],
  },
  {
    path: 'tests/attempt/:attemptId',
    component: AttemptPage,
    canActivate: [authGuard],
  },
  {
    path: 'tests/attempt/:attemptId/analytics',
    component: AnalyticsPage,
    canActivate: [authGuard],
  },
  {
    path: 'books',
    component: BooksPage,
    canActivate: [authGuard],
  },
  {
    path: 'community',
    component: CommunityPage,
    canActivate: [authGuard],
  },
  {
    path: 'engagement',
    component: EngagementPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'welcome',
  },
];
