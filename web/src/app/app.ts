import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <a routerLink="/" class="logo">🐾 PawHome</a>
      <nav class="nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Питомцы</a>
        @if (auth.isLoggedIn()) {
          <a routerLink="/my-requests" routerLinkActive="active">Мои заявки</a>
        }
        @if (auth.isAdmin()) {
          <a routerLink="/admin/requests" routerLinkActive="active">Все заявки</a>
          <a routerLink="/admin/animals/new" routerLinkActive="active">Добавить питомца</a>
        }
      </nav>
      <div class="session">
        @if (auth.user(); as user) {
          <span class="muted">{{ user.name }}</span>
          <button type="button" class="btn btn-ghost" (click)="logout()">Выйти</button>
        } @else {
          <a routerLink="/login" class="btn">Войти</a>
        }
      </div>
    </header>
    <main class="container">
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
