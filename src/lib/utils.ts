import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export enum PlayerCategory {
  MensTeam = "Men's Singles & Doubles (Team Event)",
  WomensSingles = "Women's Singles",
  WomensDoubles = "Women's Doubles",
  MixedDoubles = "Mixed Doubles",
  BoysU18 = "Boys under 18 (Born on/after July 1st 2007)",
  BoysU13 = "Boys under 13 (Born on/after July 1st 2012)",
  GirlsU18 = "Girls under 18 (Born on/after July 1st 2007)",
  GirlsU13 = "Girls under 13 (Born on/after July 1st 2012)",
  FamilyMixedDoubles = "Family Mixed Doubles (Wife-Husband, Father-Daughter, Mother-Son, Brother-Sister)",
}

export type PlayerCategoryType = `${PlayerCategory}`;

export const playerCategories: PlayerCategory[] = [
  PlayerCategory.MensTeam,
  PlayerCategory.WomensSingles,
  PlayerCategory.WomensDoubles,
  PlayerCategory.MixedDoubles,
  PlayerCategory.BoysU18,
  PlayerCategory.BoysU13,
  PlayerCategory.GirlsU18,
  PlayerCategory.GirlsU13,
  PlayerCategory.FamilyMixedDoubles,
];

export const categoryLabels: Record<PlayerCategory, { code: string; label: string }> = {
  [PlayerCategory.MensTeam]: { code: "MT", label: "Men's Team" },
  [PlayerCategory.WomensSingles]: { code: "WS", label: "Women Singles" },
  [PlayerCategory.WomensDoubles]: { code: "WD", label: "Women Doubles" },
  [PlayerCategory.BoysU13]: { code: "BU13", label: "Boys U13" },
  [PlayerCategory.GirlsU13]: { code: "GU13", label: "Girls U13" },
  [PlayerCategory.FamilyMixedDoubles]: { code: "FM", label: "Family Mixed" },
  [PlayerCategory.GirlsU18]: { code: "GU18", label: "Girls U18" },
  [PlayerCategory.BoysU18]: { code: "BU18", label: "Boys U18" },
  [PlayerCategory.MixedDoubles]: { code: "XD", label: "Mixed Doubles" },
}; 