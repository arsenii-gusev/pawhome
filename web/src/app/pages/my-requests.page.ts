import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { ADOPTION_STATUS_LABELS, AdoptionRequest } from '../core/models';

@Component({
  selector: 'app-my-requests-page',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Мои заявки</h1>

    @if (error(); as error) {
      <p class="error">{{ error }}</p>
    }

    @if (requests(); as requests) {
      <div class="list">
        @for (request of requests; track request.id) {
          <div class="card row">
            <div>
              <a [routerLink]="['/animals', request.animalId]">
                <strong>{{ request.animal.name }}</strong>
              </a>
              <p class="muted">{{ request.createdAt | date: 'd MMMM y, HH:mm' }}</p>
              <p>{{ request.message }}</p>
            </div>
            <div class="actions">
              <span class="badge" [class]="request.status">{{ labels[request.status] }}</span>
              @if (request.status === 'pending') {
                <button class="btn btn-ghost" type="button" (click)="cancel(request)">Отозвать</button>
              }
            </div>
          </div>
        } @empty {
          <p class="muted">
            Заявок пока нет. <a routerLink="/">Посмотрите питомцев</a>, которые ищут дом.
          </p>
        }
      </div>
    } @else {
      <p class="muted">Загрузка…</p>
    }
  `,
  styles: `
    .list { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; justify-content: space-between; gap: 16px; }
    .row p { margin: 4px 0; }
    .actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  `,
})
export class MyRequestsPage {
  private readonly api = inject(ApiService);
  private readonly reload = signal(0);

  protected readonly labels = ADOPTION_STATUS_LABELS;
  protected readonly error = signal<string | null>(null);

  protected readonly requests = toSignal<AdoptionRequest[]>(
    toObservable(this.reload).pipe(switchMap(() => this.api.getMyAdoptions())),
  );

  protected cancel(request: AdoptionRequest): void {
    this.api.cancelAdoption(request.id).subscribe({
      next: () => this.reload.update((v) => v + 1),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }
}
