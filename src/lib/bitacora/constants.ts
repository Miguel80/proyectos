/** Catálogos de la Bitácora Sensorial. Los valores coinciden con los CHECK de la migración 0002. */

export const KINDS = ["coffee", "tea"] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABEL: Record<Kind, string> = {
  coffee: "Café",
  tea: "Té",
};

export const TEA_TYPES = [
  "green",
  "black",
  "oolong",
  "white",
  "puerh",
  "yellow",
  "herbal",
  "other",
] as const;
export type TeaType = (typeof TEA_TYPES)[number];

export const TEA_TYPE_LABEL: Record<TeaType, string> = {
  green: "Verde",
  black: "Negro",
  oolong: "Oolong",
  white: "Blanco",
  puerh: "Pu-erh",
  yellow: "Amarillo",
  herbal: "Infusión de hierbas",
  other: "Otro",
};

export const ROAST_LEVELS = ["light", "medium", "dark"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export const ROAST_LEVEL_LABEL: Record<RoastLevel, string> = {
  light: "Claro",
  medium: "Medio",
  dark: "Oscuro",
};

/** Sugerencias para el campo "método"; el valor guardado es texto libre. */
export const BREW_METHOD_SUGGESTIONS: readonly string[] = [
  "V60",
  "Chemex",
  "Kalita Wave",
  "Aeropress",
  "Prensa francesa",
  "Moka",
  "Espresso",
  "Cold brew",
  "Western (taza o tetera)",
  "Gongfu (gaiwan)",
  "Matcha (chasen)",
];

export const TASTING_SCORES = [
  { key: "aroma", label: "Aroma" },
  { key: "acidity", label: "Acidez" },
  { key: "body", label: "Cuerpo" },
  { key: "sweetness", label: "Dulzor" },
  { key: "bitterness", label: "Amargor" },
  { key: "aftertaste", label: "Postgusto" },
  { key: "balance", label: "Balance" },
] as const;

export type TastingScoreKey = (typeof TASTING_SCORES)[number]["key"];

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

/**
 * Unidades en que se puede medir la dosis. `gramsEach` es una equivalencia APROXIMADA (café molido
 * o hebras de té al ras) que solo se usa para calcular la proporción cuando no se pesó.
 */
export const DOSE_UNITS = [
  { value: "g", label: "gramos", gramsEach: 1 },
  { value: "tsp", label: "cucharaditas (de té)", gramsEach: 2 },
  { value: "tbsp", label: "cucharadas soperas", gramsEach: 5 },
] as const;

export type DoseUnit = (typeof DOSE_UNITS)[number]["value"];

export function isDoseUnit(value: string): value is DoseUnit {
  return DOSE_UNITS.some((unit) => unit.value === value);
}

export function gramsPerDoseUnit(unit: DoseUnit): number {
  return DOSE_UNITS.find((item) => item.value === unit)?.gramsEach ?? 1;
}
