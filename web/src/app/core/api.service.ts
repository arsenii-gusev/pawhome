import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdoptionRequest,
  AdoptionStatus,
  Animal,
  AnimalsQuery,
  Paginated,
  Species,
} from './models';

export interface CreateAnimalPayload {
  name: string;
  species: Species;
  breed?: string;
  ageMonths: number;
  description?: string;
  photoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getAnimals(query: AnimalsQuery): Observable<Paginated<Animal>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.species) params = params.set('species', query.species);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    return this.http.get<Paginated<Animal>>('/api/animals', { params });
  }

  getAnimal(id: string): Observable<Animal> {
    return this.http.get<Animal>(`/api/animals/${id}`);
  }

  createAnimal(payload: CreateAnimalPayload): Observable<Animal> {
    return this.http.post<Animal>('/api/animals', payload);
  }

  createAdoption(animalId: string, message: string): Observable<AdoptionRequest> {
    return this.http.post<AdoptionRequest>('/api/adoptions', { animalId, message });
  }

  getMyAdoptions(): Observable<AdoptionRequest[]> {
    return this.http.get<AdoptionRequest[]>('/api/adoptions/my');
  }

  cancelAdoption(id: string): Observable<void> {
    return this.http.delete<void>(`/api/adoptions/${id}`);
  }

  getAllAdoptions(status?: AdoptionStatus): Observable<AdoptionRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<AdoptionRequest[]>('/api/adoptions', { params });
  }

  decideAdoption(id: string, decision: 'approve' | 'reject'): Observable<AdoptionRequest> {
    return this.http.patch<AdoptionRequest>(`/api/adoptions/${id}/${decision}`, {});
  }
}

/** Достаёт читаемое сообщение из ошибки NestJS (строка или массив ошибок валидации). */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message: unknown = error.error?.message;
    if (Array.isArray(message)) return message.join('; ');
    if (typeof message === 'string') return message;
    if (error.status === 0) return 'Сервер недоступен';
  }
  return 'Что-то пошло не так';
}
