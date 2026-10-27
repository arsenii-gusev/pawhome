import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card auth">
      <div class="tabs">
        <button type="button" [class.active]="mode() === 'login'" (click)="mode.set('login')">Вход</button>
        <button type="button" [class.active]="mode() === 'register'" (click)="mode.set('register')">
          Регистрация
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (mode() === 'register') {
          <div class="field">
            <label for="name">Имя</label>
            <input id="name" formControlName="name" autocomplete="name" />
          </div>
        }
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Пароль</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [attr.autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
          />
          @if (mode() === 'register') {
            <small class="muted">Не меньше 8 символов</small>
          }
        </div>

        @if (error(); as error) {
          <p class="error">{{ error }}</p>
        }

        <button class="btn" type="submit" [disabled]="loading()">
          {{ mode() === 'login' ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>
    </div>
  `,
  styles: `
    .auth { max-width: 420px; margin: 32px auto; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tabs button { flex: 1; padding: 8px; border: none; border-radius: 10px; background: var(--border); font: inherit; cursor: pointer; }
    .tabs button.active { background: var(--accent); color: #fff; }
    form .btn { width: 100%; }
  `,
})
export class LoginPage {
  /** Куда вернуть пользователя после входа (query-параметр returnUrl). */
  readonly returnUrl = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<Mode>('login');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    const { name, email, password } = this.form.getRawValue();
    const isRegister = this.mode() === 'register';

    if (this.form.invalid) {
      this.error.set('Проверьте email и пароль');
      return;
    }
    if (isRegister && (name.trim().length < 2 || password.length < 8)) {
      this.error.set('Укажите имя (от 2 символов) и пароль от 8 символов');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const request$ = isRegister
      ? this.auth.register(name.trim(), email, password)
      : this.auth.login(email, password);

    request$.subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl() || '/'),
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
