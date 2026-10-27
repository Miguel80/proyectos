import { TASTING_SCORES, type TastingScoreKey } from "@/lib/bitacora/constants";
import {
  listBrews,
  listPlaces,
  signPhotoUrls,
  type BrewWithRelations,
} from "@/repositories/bitacora.repository";
import type { DbClient } from "@/repositories/notes.repository";

/**
 * Cálculos del Resumen (dashboard). `computeInsights` es una función pura sobre las tazas;
 * `getInsights` solo las lee de la base y firma las fotos que se muestran.
 */

export const PERIODS = ["30", "90", "todo"] as const;
export type Period = (typeof PERIODS)[number];

export function parsePeriod(value: string | undefined): Period {
  return PERIODS.find((period) => period === value) ?? "90";
}

const TIME_ZONE = "America/Santiago";
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_SHOWN = 12;
const MONTHS_SHOWN = 6;
const MIN_RATED_FOR_RANKING = 2;
const FETCH_LIMIT = 2000;

export interface ProductStat {
  productId: string;
  name: string;
  kind: string;
  brews: number;
  ratedBrews: number;
  averageRating: number | null;
  photoPath: string | null;
  photoUrl: string | null;
}

export interface PlaceStat {
  name: string;
  brews: number;
  averageRating: number | null;
}

export interface Insights {
  totals: {
    brews: number;
    averageRating: number | null;
    places: number;
    lastSevenDays: number;
  };
  topProducts: ProductStat[];
  /** Productos con una sola valoración o ninguna: no entran al ranking. */
  unrankedProducts: number;
  places: PlaceStat[];
  placeSplit: { home: number; away: number; unknown: number };
  weekly: { label: string; brews: number }[];
  monthly: { label: string; averageRating: number | null; brews: number }[];
  profile: {
    key: TastingScoreKey;
    label: string;
    average: number | null;
    samples: number;
  }[];
  flavors: { name: string; count: number }[];
}

const average = (values: number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

/** "Café  Sorrento" y "café sorrento" son el mismo lugar. */
export function placeKey(place: string): string {
  return place
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const isHome = (key: string): boolean =>
  /^(en )?(mi )?casa$/.test(key) || key === "home";

/** Nombre a mostrar para un grupo de escrituras del mismo lugar: la más frecuente. */
function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? values[0] ?? ""
  );
}

const monthParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});
const monthLabel = new Intl.DateTimeFormat("es-CL", {
  timeZone: TIME_ZONE,
  month: "short",
});

function monthKey(date: Date): string {
  const parts = monthParts.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export function computeInsights(
  brews: BrewWithRelations[],
  now: Date,
): Insights {
  const rated = brews.flatMap((brew) =>
    brew.rating === null ? [] : [brew.rating],
  );

  // --- Lugares ---
  const byPlace = new Map<
    string,
    { names: string[]; ratings: number[]; brews: number }
  >();
  const split = { home: 0, away: 0, unknown: 0 };
  for (const brew of brews) {
    const place = brew.place?.trim();
    if (!place) {
      split.unknown += 1;
      continue;
    }
    const home = isHome(placeKey(place));
    if (home) split.home += 1;
    else split.away += 1;

    // "Casa", "en casa", "Mi casa" se agrupan como un solo lugar.
    const key = home ? "casa" : placeKey(place);
    const entry = byPlace.get(key) ?? { names: [], ratings: [], brews: 0 };
    entry.names.push(home ? "En casa" : place);
    entry.brews += 1;
    if (brew.rating !== null) entry.ratings.push(brew.rating);
    byPlace.set(key, entry);
  }
  const places: PlaceStat[] = [...byPlace.values()]
    .map((entry) => ({
      name: mostCommon(entry.names),
      brews: entry.brews,
      averageRating: average(entry.ratings),
    }))
    .sort(
      (a, b) =>
        b.brews - a.brews || (b.averageRating ?? 0) - (a.averageRating ?? 0),
    )
    .slice(0, 6);

  // --- Productos ---
  const byProduct = new Map<string, ProductStat & { ratings: number[] }>();
  for (const brew of brews) {
    if (!brew.product) continue;
    const entry = byProduct.get(brew.product.id) ?? {
      productId: brew.product.id,
      name: brew.product.name,
      kind: brew.product.kind,
      brews: 0,
      ratedBrews: 0,
      averageRating: null,
      photoPath: null,
      photoUrl: null,
      ratings: [],
    };
    entry.brews += 1;
    if (brew.rating !== null) entry.ratings.push(brew.rating);
    // Las tazas vienen de la más reciente a la más antigua: la primera con foto es la última.
    if (!entry.photoPath && brew.photo_path) entry.photoPath = brew.photo_path;
    byProduct.set(brew.product.id, entry);
  }
  const allProducts = [...byProduct.values()].map(({ ratings, ...entry }) => ({
    ...entry,
    ratedBrews: ratings.length,
    averageRating: average(ratings),
  }));
  const ranked = allProducts
    .filter((product) => product.ratedBrews >= MIN_RATED_FOR_RANKING)
    .sort(
      (a, b) =>
        (b.averageRating ?? 0) - (a.averageRating ?? 0) || b.brews - a.brews,
    );

  // --- Tendencias ---
  const weekly = Array.from({ length: WEEKS_SHOWN }, (_, index) => ({
    label: index === 0 ? "hoy" : `-${index}s`,
    brews: 0,
  })).reverse();
  for (const brew of brews) {
    const weeksAgo = Math.floor(
      (now.getTime() - new Date(brew.brewed_at).getTime()) / (7 * DAY_MS),
    );
    if (weeksAgo >= 0 && weeksAgo < WEEKS_SHOWN) {
      const bucket = weekly[WEEKS_SHOWN - 1 - weeksAgo];
      if (bucket) bucket.brews += 1;
    }
  }

  const monthBuckets: {
    key: string;
    label: string;
    ratings: number[];
    brews: number;
  }[] = [];
  for (let offset = MONTHS_SHOWN - 1; offset >= 0; offset -= 1) {
    const reference = new Date(now.getTime() - offset * 30.44 * DAY_MS);
    monthBuckets.push({
      key: monthKey(reference),
      label: monthLabel.format(reference),
      ratings: [],
      brews: 0,
    });
  }
  for (const brew of brews) {
    const bucket = monthBuckets.find(
      (item) => item.key === monthKey(new Date(brew.brewed_at)),
    );
    if (!bucket) continue;
    bucket.brews += 1;
    if (brew.rating !== null) bucket.ratings.push(brew.rating);
  }

  // --- Perfil de sabor ---
  const profile = TASTING_SCORES.map(({ key, label }) => {
    const values = brews.flatMap((brew) => {
      const value = brew.tasting?.[key];
      return typeof value === "number" ? [value] : [];
    });
    return { key, label, average: average(values), samples: values.length };
  });

  const flavorCounts = new Map<string, number>();
  for (const brew of brews) {
    for (const descriptor of brew.tasting?.descriptors ?? []) {
      const name = descriptor.trim().toLowerCase();
      if (name) flavorCounts.set(name, (flavorCounts.get(name) ?? 0) + 1);
    }
  }
  const flavors = [...flavorCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"))
    .slice(0, 12);

  return {
    totals: {
      brews: brews.length,
      averageRating: average(rated),
      places: byPlace.size,
      lastSevenDays: brews.filter(
        (brew) =>
          now.getTime() - new Date(brew.brewed_at).getTime() <= 7 * DAY_MS,
      ).length,
    },
    topProducts: ranked.slice(0, 5),
    unrankedProducts: allProducts.length - ranked.length,
    places,
    placeSplit: split,
    weekly,
    monthly: monthBuckets.map((bucket) => ({
      label: bucket.label,
      averageRating: average(bucket.ratings),
      brews: bucket.brews,
    })),
    profile,
    flavors,
  };
}

export async function getInsights(
  db: DbClient,
  ownerId: string,
  period: Period,
): Promise<Insights> {
  const now = new Date();
  const since =
    period === "todo"
      ? undefined
      : new Date(now.getTime() - Number(period) * DAY_MS).toISOString();
  const brews = await listBrews(db, ownerId, FETCH_LIMIT, since);
  const insights = computeInsights(brews, now);

  // Foto del último registro de cada producto del ranking (si falla el firmado, se muestran sin foto).
  const paths = insights.topProducts.flatMap((product) =>
    product.photoPath ? [product.photoPath] : [],
  );
  const urls = await signPhotoUrls(db, paths).catch(
    () => new Map<string, string>(),
  );
  for (const product of insights.topProducts) {
    product.photoUrl = product.photoPath
      ? (urls.get(product.photoPath) ?? null)
      : null;
  }

  return insights;
}

/** Lugares ya usados, del más frecuente al menos, sin duplicados por mayúsculas o tildes. */
export async function getPlaceSuggestions(
  db: DbClient,
  ownerId: string,
): Promise<string[]> {
  const used = await listPlaces(db, ownerId);
  const groups = new Map<string, string[]>();
  for (const place of used) {
    const key = placeKey(place);
    if (key) groups.set(key, [...(groups.get(key) ?? []), place.trim()]);
  }
  return [...groups.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, 30)
    .map(mostCommon);
}
