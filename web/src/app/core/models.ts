export type Role = 'user' | 'admin';
export type Species = 'dog' | 'cat' | 'other';
export type AnimalStatus = 'available' | 'reserved' | 'adopted';
export type AdoptionStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Animal {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  ageMonths: number;
  description: string;
  status: AnimalStatus;
  photoUrl: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AnimalsQuery {
  species?: Species | '';
  search?: string;
  page: number;
  limit: number;
}

export interface AdoptionRequest {
  id: string;
  animalId: string;
  animal: Animal;
  user?: User;
  message: string;
  status: AdoptionStatus;
  createdAt: string;
}

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'Собака',
  cat: 'Кошка',
  other: 'Другое',
};

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  available: 'Ищет дом',
  reserved: 'Забронирован',
  adopted: 'Нашёл дом',
};

export const ADOPTION_STATUS_LABELS: Record<AdoptionStatus, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};
