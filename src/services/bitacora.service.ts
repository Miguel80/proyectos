import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { AppError } from "@/lib/api/response";
import {
  KINDS,
  ROAST_LEVELS,
  TASTING_SCORES,
  TEA_TYPES,
} from "@/lib/bitacora/constants";
import type { DbClient } from "@/repositories/notes.repository";
import {
  deleteBrew,
  deleteTasting,
  getBrew,
  getBrewPhotoPath,
  insertBrew,
  insertProduct,
  listBrews,
  listProducts,
  removePhoto,
  signPhotoUrls,
  updateBrewRow,
  uploadPhoto,
  upsertTasting,
  type BrewRow,
  type BrewWithRelations,
  type ProductRow,
  type TastingInsert,
} from "@/repositories/bitacora.repository";

/**
 * Lógica de negocio de la Bitácora Sensorial.
 * Convierte FormData (todo texto) en datos validados y orquesta el repositorio.
 */

// --- Helpers de validación para formularios -------------------------------------------------

const blankToUndefined = (value: unknown): unknown =>
  value === "" || value === null || value === undefined ? undefined : value;

const text = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().min(1).max(max).optional());

const requiredText = (max: number, message: string) =>
  z.string({ error: message }).trim().min(1, message).max(max);

/** Acepta coma decimal ("16,5"), habitual al escribir en español. */
const toNumber = (value: unknown): number | undefined => {
  const cleaned = blankToUndefined(value);
  return cleaned === undefined
    ? undefined
    : Number(String(cleaned).trim().replace(",", "."));
};

/** Acepta segundos ("210") o reloj ("3:30"). */
const toSeconds = (value: unknown): number | undefined => {
  const cleaned = blankToUndefined(value);
  if (cleaned === undefined) return undefined;
  const raw = String(cleaned).trim();
  const clock = /^(\d+):([0-5]?\d)$/.exec(raw);
  if (clock) return Number(clock[1] ?? 0) * 60 + Number(clock[2] ?? 0);
  return Number(raw.replace(",", "."));
};

/** Agua: acepta ml ("250", "250 ml") o litros ("1,5 L", "1.5 lt"); se guarda en ml. */
const toMilliliters = (value: unknown): number | undefined => {
  const cleaned = blankToUndefined(value);
  if (cleaned === undefined) return undefined;
  const match = /^([\d.,]+)\s*(l|lt|lts|litro|litros|ml)?$/i.exec(
    String(cleaned).trim(),
  );
  if (!match) return Number.NaN;
  const amount = Number((match[1] ?? "").replace(",", "."));
  const unit = (match[2] ?? "ml").toLowerCase();
  return unit === "ml" ? amount : amount * 1000;
};

const number = (schema: z.ZodNumber) =>
  z.preprocess(toNumber, schema.optional());

const duration = z.preprocess(
  toSeconds,
  z
    .number({ error: "Escribe el tiempo como 3:30 o en segundos" })
    .int()
    .positive()
    .max(86400)
    .optional(),
);

const score = number(z.number().int().min(1).max(5));

const date = z.preprocess(blankToUndefined, z.iso.date().optional());

const descriptors = z.preprocess(
  (value) => {
    const cleaned = blankToUndefined(value);
    if (typeof cleaned !== "string") return [];
    return cleaned
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  },
  z.array(z.string().max(40)).max(20),
);

// --- Esquemas -------------------------------------------------------------------------------

export const createProductSchema = z.object({
  kind: z.enum(KINDS, { error: "Elige café o té" }),
  name: requiredText(120, "El nombre es obligatorio"),
  origin_country: text(80),
  region: text(80),
  producer: text(120),
  variety: text(120),
  process: text(120),
  tea_type: z.preprocess(blankToUndefined, z.enum(TEA_TYPES).optional()),
  roast_level: z.preprocess(blankToUndefined, z.enum(ROAST_LEVELS).optional()),
  roast_date: date,
  purchased_on: date,
  supplier: text(120),
  notes: text(2000),
});

export const logBrewSchema = z.object({
  product_id: z.uuid({ error: "Elige un producto" }),
  method: text(60),
  dose_g: number(z.number().positive().max(9999)),
  water_g: z.preprocess(
    toMilliliters,
    z.number().positive().max(99999).optional(),
  ),
  water_temp_c: number(z.number().min(0).max(100)),
  grind_setting: text(60),
  steep_seconds: duration,
  equipment: text(200),
  water_notes: text(200),
  place: text(120),
  brewed_at: z.preprocess(
    blankToUndefined,
    z.iso
      .datetime({ offset: true, error: "Fecha y hora no válidas" })
      .optional(),
  ),
  rating: number(z.number().int().min(1).max(5)),
  notes: text(2000),
  aroma: score,
  acidity: score,
  body: score,
  sweetness: score,
  bitterness: score,
  aftertaste: score,
  balance: score,
  descriptors,
  tasting_notes: text(2000),
});

export const updateBrewSchema = logBrewSchema.extend({
  id: z.uuid(),
  remove_photo: z.preprocess(
    (value) => value === "on" || value === "true",
    z.boolean(),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type LogBrewInput = z.infer<typeof logBrewSchema>;

/** Convierte un FormData en un objeto plano para pasarlo a los esquemas. */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(formData.entries());
}

// --- Casos de uso ---------------------------------------------------------------------------

export async function getProducts(
  db: DbClient,
  ownerId: string,
): Promise<ProductRow[]> {
  return listProducts(db, ownerId);
}

export async function createProduct(
  db: DbClient,
  user: User,
  input: unknown,
): Promise<ProductRow> {
  const parsed = createProductSchema.parse(input);
  const isCoffee = parsed.kind === "coffee";

  return insertProduct(db, {
    user_id: user.id,
    kind: parsed.kind,
    name: parsed.name,
    origin_country: parsed.origin_country ?? null,
    region: parsed.region ?? null,
    producer: parsed.producer ?? null,
    variety: parsed.variety ?? null,
    process: parsed.process ?? null,
    // Campos propios de cada tipo: se descartan los del otro.
    tea_type: isCoffee ? null : (parsed.tea_type ?? null),
    roast_level: isCoffee ? (parsed.roast_level ?? null) : null,
    roast_date: isCoffee ? (parsed.roast_date ?? null) : null,
    purchased_on: parsed.purchased_on ?? null,
    supplier: parsed.supplier ?? null,
    notes: parsed.notes ?? null,
  });
}

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Saca la foto del formulario (si hay) y la valida. El bucket vuelve a imponer tipo y tamaño. */
function extractPhoto(
  input: unknown,
): { file: File; extension: string } | null {
  if (typeof input !== "object" || input === null) return null;
  const photo = (input as Record<string, unknown>).photo;
  if (!(photo instanceof File) || photo.size === 0) return null;

  const extension = PHOTO_EXTENSIONS[photo.type];
  if (!extension)
    throw new AppError(
      "VALIDATION_ERROR",
      "La foto debe ser JPG, PNG o WebP",
      400,
    );
  if (photo.size > MAX_PHOTO_BYTES)
    throw new AppError("VALIDATION_ERROR", "La foto pesa más de 4 MB", 400);
  return { file: photo, extension };
}

export async function logBrew(
  db: DbClient,
  user: User,
  input: unknown,
): Promise<BrewRow> {
  const parsed = logBrewSchema.parse(input);
  const photo = extractPhoto(input);

  const id = crypto.randomUUID();
  const photoPath = photo ? `${user.id}/${id}.${photo.extension}` : null;
  if (photo && photoPath) await uploadPhoto(db, photoPath, photo.file);

  let brew: BrewRow;
  try {
    brew = await insertBrew(db, {
      id,
      user_id: user.id,
      ...(parsed.brewed_at ? { brewed_at: parsed.brewed_at } : {}),
      product_id: parsed.product_id,
      method: parsed.method ?? "Sin especificar",
      dose_g: parsed.dose_g ?? null,
      water_g: parsed.water_g ?? null,
      water_temp_c: parsed.water_temp_c ?? null,
      grind_setting: parsed.grind_setting ?? null,
      steep_seconds: parsed.steep_seconds ?? null,
      equipment: parsed.equipment ?? null,
      water_notes: parsed.water_notes ?? null,
      place: parsed.place ?? null,
      rating: parsed.rating ?? null,
      notes: parsed.notes ?? null,
      photo_path: photoPath,
    });
  } catch (error) {
    // No dejar una foto huérfana si la taza no se pudo guardar.
    if (photoPath) await removePhoto(db, photoPath).catch(() => undefined);
    throw error;
  }

  const tasting = buildTasting(user.id, brew.id, parsed);
  if (tasting) {
    await upsertTasting(db, tasting);
  }

  return brew;
}

/** Arma la cata a partir del formulario; devuelve null si no se llenó ningún dato de cata. */
function buildTasting(
  userId: string,
  brewId: string,
  parsed: LogBrewInput,
): TastingInsert | null {
  const tasting: TastingInsert = {
    user_id: userId,
    brew_id: brewId,
    descriptors: parsed.descriptors,
    notes: parsed.tasting_notes ?? null,
  };
  let hasTasting =
    parsed.descriptors.length > 0 || parsed.tasting_notes !== undefined;

  for (const { key } of TASTING_SCORES) {
    const value = parsed[key];
    if (value !== undefined) {
      tasting[key] = value;
      hasTasting = true;
    }
  }

  return hasTasting ? tasting : null;
}

export async function updateBrew(
  db: DbClient,
  user: User,
  input: unknown,
): Promise<BrewRow> {
  const parsed = updateBrewSchema.parse(input);
  const photo = extractPhoto(input);

  const current = await getBrewPhotoPath(db, parsed.id);
  const newPath = photo
    ? `${user.id}/${parsed.id}-${crypto.randomUUID().slice(0, 8)}.${photo.extension}`
    : null;
  if (photo && newPath) await uploadPhoto(db, newPath, photo.file);

  // Foto resultante: la nueva si se subió; ninguna si pidió quitarla; la actual en otro caso.
  const photoPath = newPath ?? (parsed.remove_photo ? null : current);

  let brew: BrewRow;
  try {
    brew = await updateBrewRow(db, parsed.id, user.id, {
      product_id: parsed.product_id,
      ...(parsed.brewed_at ? { brewed_at: parsed.brewed_at } : {}),
      method: parsed.method ?? "Sin especificar",
      dose_g: parsed.dose_g ?? null,
      water_g: parsed.water_g ?? null,
      water_temp_c: parsed.water_temp_c ?? null,
      grind_setting: parsed.grind_setting ?? null,
      steep_seconds: parsed.steep_seconds ?? null,
      equipment: parsed.equipment ?? null,
      water_notes: parsed.water_notes ?? null,
      place: parsed.place ?? null,
      rating: parsed.rating ?? null,
      notes: parsed.notes ?? null,
      photo_path: photoPath,
    });
  } catch (error) {
    if (newPath) await removePhoto(db, newPath).catch(() => undefined);
    throw error;
  }

  const tasting = buildTasting(user.id, brew.id, parsed);
  if (tasting) {
    await upsertTasting(db, tasting);
  } else {
    await deleteTasting(db, brew.id);
  }

  // Solo tras guardar con éxito se borra la foto anterior que quedó reemplazada o quitada.
  if (current && current !== photoPath)
    await removePhoto(db, current).catch(() => undefined);

  return brew;
}

export async function getBrewForEdit(
  db: DbClient,
  ownerId: string,
  id: unknown,
): Promise<BrewWithRelations | null> {
  return getBrew(db, ownerId, z.uuid().parse(id));
}

export async function removeBrew(db: DbClient, id: unknown): Promise<void> {
  const brewId = z.uuid().parse(id);
  const photoPath = await getBrewPhotoPath(db, brewId);

  await deleteBrew(db, brewId);
  if (photoPath) await removePhoto(db, photoPath).catch(() => undefined);
}

export type BrewView = BrewWithRelations & { photoUrl: string | null };

/** Agrega a cada taza la URL firmada (temporal) de su foto. Si falla el firmado, se muestran sin foto. */
export async function attachPhotoUrls(
  db: DbClient,
  brews: BrewWithRelations[],
): Promise<BrewView[]> {
  const paths = brews.flatMap((brew) =>
    brew.photo_path ? [brew.photo_path] : [],
  );
  const urls = await signPhotoUrls(db, paths).catch(
    () => new Map<string, string>(),
  );

  return brews.map((brew) => ({
    ...brew,
    photoUrl: brew.photo_path ? (urls.get(brew.photo_path) ?? null) : null,
  }));
}

export interface BitacoraOverview {
  brews: BrewWithRelations[];
  stats: {
    shown: number;
    averageRating: number | null;
    lastBrewAt: string | null;
  };
}

const OVERVIEW_LIMIT = 50;

export async function getOverview(
  db: DbClient,
  ownerId: string,
): Promise<BitacoraOverview> {
  const brews = await listBrews(db, ownerId, OVERVIEW_LIMIT);
  const rated = brews.flatMap((brew) =>
    brew.rating === null ? [] : [brew.rating],
  );

  return {
    brews,
    stats: {
      shown: brews.length,
      averageRating:
        rated.length > 0
          ? rated.reduce((sum, n) => sum + n, 0) / rated.length
          : null,
      lastBrewAt: brews[0]?.brewed_at ?? null,
    },
  };
}
