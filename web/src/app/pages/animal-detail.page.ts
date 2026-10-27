import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ageLabel, speciesEmoji } from '../core/format';
import { Animal, ANIMAL_STATUS_LABELS, SPECIES_LABELS } from '../core/models';

@Component({
  selector: 'app-animal-detail-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/" class="muted">← Все питомцы</a>

    @if (animal() === undefined) {
      <p class="muted">Загрузка…</p>
    } @else if (animal(); as animal) {
      <div class="layout">
        @if (animal.photoUrl) {
          <img class="photo" [src]="animal.photoUrl" [alt]="animal.name" />
        } @else {
          <div class="photo">{{ emoji(animal) }}</div>
        }

        <div class="card">
          <h1>{{ animal.name }}</h1>
          <p>
            <span class="badge" [class]="animal.status">{{ statusLabels[animal.status] }}</span>
          </p>
          <p class="muted">
            {{ speciesLabels[animal.species] }}
            @if (animal.breed) {
              · {{ animal.breed }}
            }
            · {{ age(animal) }}
          </p>
          <p>{{ animal.description || 'Описание пока не добавлено.' }}</p>

          @if (animal.status === 'available') {
            @if (submitted()) {
              <p class="success">Заявка отправлена! Статус можно отслеживать в разделе «Мои заявки».</p>
            } @else if (auth.isLoggedIn()) {
              <form (submit)="$event.preventDefault(); apply(animal.id)">
                <div class="field">
                  <label for="message">Расскажите о себе и условиях для питомца</label>
                  <textarea id="message" [formControl]="message"></textarea>
                </div>
                @if (error(); as error) {
                  <p class="error">{{ error }}</p>
                }
                <button class="btn" type="submit" [disabled]="message.invalid || sending()">
                  Хочу забрать домой
                </button>
              </form>
            } @else {
              <a class="btn" routerLink="/login" [queryParams]="{ returnUrl: '/animals/' + animal.id }">
                Войдите, чтобы подать заявку
              </a>
            }
          }
        </div>
      </div>
    } @else {
      <p class="error">Питомец не найден.</p>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; margin-top: 16px; }
    @media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
    h1 { margin-top: 0; }
  `,
})
export class AnimalDetailPage {
  /** Привязывается из параметра маршрута :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly statusLabels = ANIMAL_STATUS_LABELS;

  /** undefined — загрузка, null — не найдено. */
  protected readonly animal = toSignal<Animal | null | undefined>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.api.getAnimal(id).pipe(
          map((animal): Animal | null => animal),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: undefined },
  );

  protected readonly message = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)],
  });
  protected readonly sending = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected apply(animalId: string): void {
    if (this.message.invalid) return;
    this.sending.set(true);
    this.error.set(null);

    this.api.createAdoption(animalId, this.message.value).subscribe({
      next: () => {
        this.sending.set(false);
        this.submitted.set(true);
      },
      error: (err: unknown) => {
        this.sending.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  protected emoji(animal: Animal): string {
    return speciesEmoji(animal.species);
  }

  protected age(animal: Animal): string {
    return ageLabel(animal.ageMonths);
  }
}
