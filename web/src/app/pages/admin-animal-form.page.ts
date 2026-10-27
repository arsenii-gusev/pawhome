import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { Species, SPECIES_LABELS } from '../core/models';

@Component({
  selector: 'app-admin-animal-form-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card form-card">
      <h1>Новый питомец</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="name">Кличка</label>
          <input id="name" formControlName="name" />
        </div>
        <div class="row">
          <div class="field">
            <label for="species">Вид</label>
            <select id="species" formControlName="species">
              @for (option of speciesOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="age">Возраст, мес.</label>
            <input id="age" type="number" min="0" max="400" formControlName="ageMonths" />
          </div>
        </div>
        <div class="field">
          <label for="breed">Порода</label>
          <input id="breed" formControlName="breed" />
        </div>
        <div class="field">
          <label for="photo">Ссылка на фото</label>
          <input id="photo" type="url" formControlName="photoUrl" placeholder="https://…" />
        </div>
        <div class="field">
          <label for="description">Описание</label>
          <textarea id="description" formControlName="description"></textarea>
        </div>

        @if (error(); as error) {
          <p class="error">{{ error }}</p>
        }
        <button class="btn" type="submit" [disabled]="form.invalid || saving()">Сохранить</button>
      </form>
    </div>
  `,
  styles: `
    .form-card { max-width: 560px; margin: 0 auto; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `,
})
export class AdminAnimalFormPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly speciesOptions = (Object.keys(SPECIES_LABELS) as Species[]).map((value) => ({
    value,
    label: SPECIES_LABELS[value],
  }));

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    species: ['dog' as Species, [Validators.required]],
    ageMonths: [12, [Validators.required, Validators.min(0), Validators.max(400)]],
    breed: ['', [Validators.maxLength(100)]],
    photoUrl: [''],
    description: ['', [Validators.maxLength(2000)]],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    this.saving.set(true);
    this.error.set(null);

    this.api
      .createAnimal({
        name: value.name.trim(),
        species: value.species,
        ageMonths: Number(value.ageMonths),
        breed: value.breed.trim() || undefined,
        photoUrl: value.photoUrl.trim() || undefined,
        description: value.description.trim() || undefined,
      })
      .subscribe({
        next: (animal) => void this.router.navigate(['/animals', animal.id]),
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(errorMessage(err));
        },
      });
  }
}
