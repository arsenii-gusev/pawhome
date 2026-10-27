import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { ADOPTION_STATUS_LABELS, AdoptionRequest, AdoptionStatus } from '../core/models';

@Component({
  selector: 'app-admin-requests-page',
  imports: [RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Заявки на усыновление</h1>

    <div class="tabs">
      @for (tab of tabs; track tab.value) {
        <button
          type="button"
          class="btn"
          [class.btn-ghost]="status() !== tab.value"
          (click)="status.set(tab.value)"
        >
          {{ tab.label }}
        </button>
      }
    </div>

    @if (error(); as error) {
      <p class="error">{{ error }}</p>
    }

    @if (requests(); as requests) {
      <div class="list">
        @for (request of requests; track request.id) {
          <div class="card">
            <div class="head">
              <a [routerLink]="['/animals', request.animalId]"><strong>{{ request.animal.name }}</strong></a>
              <span class="badge" [class]="request.status">{{ labels[request.status] }}</span>
            </div>
            <p class="muted">
              {{ request.user?.name }} · {{ request.user?.email }} ·
              {{ request.createdAt | date: 'd MMMM y, HH:mm' }}
            </p>
            <p>{{ request.message }}</p>
            @if (request.status === 'pending') {
              <div class="actions">
                <button class="btn" type="button" [disabled]="busyId() === request.id" (click)="decide(request, 'approve')">
                  Одобрить
                </button>
                <button
                  class="btn btn-danger"
                  type="button"
                  [disabled]="busyId() === request.id"
                  (click)="decide(request, 'reject')"
                >
                  Отклонить
                </button>
              </div>
            }
          </div>
        } @empty {
          <p class="muted">Заявок нет.</p>
        }
      </div>
    } @else {
      <p class="muted">Загрузка…</p>
    }
  `,
  styles: `
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .actions { display: flex; gap: 8px; }
  `,
})
export class AdminRequestsPage {
  private readonly api = inject(ApiService);

  protected readonly labels = ADOPTION_STATUS_LABELS;
  protected readonly tabs: Array<{ value: AdoptionStatus | ''; label: string }> = [
    { value: 'pending', label: 'Новые' },
    { value: 'approved', label: 'Одобренные' },
    { value: 'rejected', label: 'Отклонённые' },
    { value: '', label: 'Все' },
  ];

  protected readonly status = signal<AdoptionStatus | ''>('pending');
  private readonly reload = signal(0);
  protected readonly busyId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  private readonly query = computed(() => ({ status: this.status(), reload: this.reload() }));

  protected readonly requests = toSignal<AdoptionRequest[]>(
    toObservable(this.query).pipe(
      switchMap(({ status }) => this.api.getAllAdoptions(status || undefined)),
    ),
  );

  protected decide(request: AdoptionRequest, decision: 'approve' | 'reject'): void {
    this.busyId.set(request.id);
    this.error.set(null);
    this.api.decideAdoption(request.id, decision).subscribe({
      next: () => {
        this.busyId.set(null);
        this.reload.update((v) => v + 1);
      },
      error: (err: unknown) => {
        this.busyId.set(null);
        this.error.set(errorMessage(err));
      },
    });
  }
}
