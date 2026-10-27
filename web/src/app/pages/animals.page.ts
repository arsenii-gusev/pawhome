import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { ageLabel, speciesEmoji } from '../core/format';
import {
  Animal,
  ANIMAL_STATUS_LABELS,
  AnimalsQuery,
  Paginated,
  Species,
  SPECIES_LABELS,
} from '../core/models';

interface ListState {
  loading: boolean;
  data: Paginated<Animal> | null;
  error: string | null;
}

@Component({
  selector: 'app-animals-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Питомцы ищут дом</h1>

    <div class="filters">
      <input
        #searchInput
        type="search"
        placeholder="Кличка или порода"
        [value]="search()"
        (input)="setSearch(searchInput.value)"
      />
      <select #speciesSelect [value]="species()" (change)="setSpecies(speciesSelect.value)">
        <option value="">Все виды</option>
        @for (option of speciesOptions; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </div>

    @if (state().error; as error) {
      <p class="error">{{ error }}</p>
    }

    @if (state().data; as data) {
      <p class="muted">Найдено: {{ data.total }}</p>
      <div class="grid">
        @for (animal of data.items; track animal.id) {
          <a class="card animal" [routerLink]="['/animals', animal.id]">
            @if (animal.photoUrl) {
              <img class="photo" [src]="animal.photoUrl" [alt]="animal.name" />
            } @else {
              <div class="photo">{{ emoji(animal.species) }}</div>
            }
            <h3>{{ animal.name }}</h3>
            <p class="muted">{{ animal.breed || speciesLabels[animal.species] }} · {{ age(animal.ageMonths) }}</p>
            <span class="badge" [class]="animal.status">{{ statusLabels[animal.status] }}</span>
          </a>
        } @empty {
          <p class="muted">Никого не нашлось — попробуйте изменить фильтры.</p>
        }
      </div>

      @if (totalPages() > 1) {
        <div class="pager">
          <button class="btn btn-ghost" type="button" [disabled]="page() === 1" (click)="page.set(page() - 1)">
            Назад
          </button>
          <span>{{ page() }} / {{ totalPages() }}</span>
          <button
            class="btn btn-ghost"
            type="button"
            [disabled]="page() >= totalPages()"
            (click)="page.set(page() + 1)"
          >
            Вперёд
          </button>
        </div>
      }
    } @else if (state().loading) {
      <p class="muted">Загрузка…</p>
    }
  `,
  styles: `
    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .filters input { flex: 1; min-width: 200px; }
    .animal { text-decoration: none; display: flex; flex-direction: column; gap: 6px; }
    .animal h3, .animal p { margin: 0; }
    .animal:hover { border-color: var(--accent); }
    .pager { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 24px; }
  `,
})
export class AnimalsPage {
  private readonly api = inject(ApiService);

  protected readonly speciesLabels = SPECIES_LABELS;
  protected readonly statusLabels = ANIMAL_STATUS_LABELS;
  protected readonly speciesOptions = (Object.keys(SPECIES_LABELS) as Species[]).map((value) => ({
    value,
    label: SPECIES_LABELS[value],
  }));

  protected readonly species = signal<Species | ''>('');
  protected readonly search = signal('');
  protected readonly page = signal(1);
  private readonly limit = 12;

  private readonly query = computed<AnimalsQuery>(() => ({
    species: this.species(),
    search: this.search(),
    page: this.page(),
    limit: this.limit,
  }));

  /** Любое изменение фильтров → новый запрос; switchMap отменяет устаревший. */
  protected readonly state = toSignal(
    toObservable(this.query).pipe(
      debounceTime(250),
      switchMap((query) =>
        this.api.getAnimals(query).pipe(
          map((data): ListState => ({ loading: false, data, error: null })),
          catchError((error: unknown) =>
            of<ListState>({ loading: false, data: null, error: errorMessage(error) }),
          ),
          startWith<ListState>({ loading: true, data: null, error: null }),
        ),
      ),
    ),
    { initialValue: { loading: true, data: null, error: null } satisfies ListState },
  );

  protected readonly totalPages = computed(() => {
    const data = this.state().data;
    return data ? Math.ceil(data.total / data.limit) : 0;
  });

  protected setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  protected setSpecies(value: string): void {
    this.species.set(value as Species | '');
    this.page.set(1);
  }

  protected emoji(species: Species): string {
    return speciesEmoji(species);
  }

  protected age(months: number): string {
    return ageLabel(months);
  }
}
