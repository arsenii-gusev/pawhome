import { Species } from './models';

const SPECIES_EMOJI: Record<Species, string> = { dog: '🐶', cat: '🐱', other: '🐰' };

export function speciesEmoji(species: Species): string {
  return SPECIES_EMOJI[species];
}

/** 18 → «1 год 6 мес.», 5 → «5 мес.» */
export function ageLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${pluralYears(years)}`);
  if (rest > 0 || years === 0) parts.push(`${rest} мес.`);
  return parts.join(' ');
}

function pluralYears(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'год';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
  return 'лет';
}
