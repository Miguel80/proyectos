import { AppError } from "@/lib/api/response";
import type { Database } from "@/types/database";
import type { DbClient } from "@/repositories/notes.repository";

/**
 * Acceso a datos de la Bitácora Sensorial. Solo habla con Supabase;
 * la seguridad por usuario la imponen las políticas RLS de la migración 0002.
 */

type Tables = Database["public"]["Tables"];

export type ProductRow = Tables["bitacora_products"]["Row"];
export type ProductInsert = Tables["bitacora_products"]["Insert"];
export type BrewRow = Tables["bitacora_brews"]["Row"];
export type BrewInsert = Tables["bitacora_brews"]["Insert"];
export type TastingRow = Tables["bitacora_tastings"]["Row"];
export type TastingInsert = Tables["bitacora_tastings"]["Insert"];

export type BrewWithRelations = BrewRow & {
  product: Pick<ProductRow, "id" | "name" | "kind"> | null;
  tasting: TastingRow | null;
};

function dbError(message: string, code: string | undefined): AppError {
  return new AppError("DB_ERROR", message, 500, code);
}

/**
 * Ojo: con cuadernos compartidos las políticas RLS también permiten LEER filas de otros usuarios,
 * por eso toda lectura filtra explícitamente por el dueño.
 */
export async function listProducts(
  db: DbClient,
  ownerId: string,
): Promise<ProductRow[]> {
  const { data, error } = await db
    .from("bitacora_products")
    .select("*")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw dbError("No se pudieron leer los productos", error.code);
  return data;
}

export async function insertProduct(
  db: DbClient,
  input: ProductInsert,
): Promise<ProductRow> {
  const { data, error } = await db
    .from("bitacora_products")
    .insert(input)
    .select()
    .single();

  if (error) throw dbError("No se pudo crear el producto", error.code);
  return data;
}

export async function listBrews(
  db: DbClient,
  ownerId: string,
  limit: number,
  since?: string,
): Promise<BrewWithRelations[]> {
  let query = db
    .from("bitacora_brews")
    .select(
      "*, product:bitacora_products(id, name, kind), tasting:bitacora_tastings(*)",
    )
    .eq("user_id", ownerId);
  if (since) query = query.gte("brewed_at", since);

  const { data, error } = await query
    .order("brewed_at", { ascending: false })
    .limit(limit);

  if (error) throw dbError("No se pudieron leer las preparaciones", error.code);
  return data as unknown as BrewWithRelations[];
}

export async function insertBrew(
  db: DbClient,
  input: BrewInsert,
): Promise<BrewRow> {
  const { data, error } = await db
    .from("bitacora_brews")
    .insert(input)
    .select()
    .single();

  if (error) throw dbError("No se pudo registrar la preparación", error.code);
  return data;
}

export async function upsertTasting(
  db: DbClient,
  input: TastingInsert,
): Promise<TastingRow> {
  const { data, error } = await db
    .from("bitacora_tastings")
    .upsert(input, { onConflict: "brew_id" })
    .select()
    .single();

  if (error) throw dbError("No se pudo guardar la cata", error.code);
  return data;
}

export async function deleteBrew(db: DbClient, id: string): Promise<void> {
  const { error } = await db.from("bitacora_brews").delete().eq("id", id);

  if (error) throw dbError("No se pudo eliminar la preparación", error.code);
}

export type ShareRow = Tables["bitacora_shares"]["Row"];

export async function listShares(db: DbClient): Promise<ShareRow[]> {
  const { data, error } = await db
    .from("bitacora_shares")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw dbError("No se pudieron leer las invitaciones", error.code);
  return data;
}

export async function insertShare(
  db: DbClient,
  input: Tables["bitacora_shares"]["Insert"],
): Promise<ShareRow> {
  const { data, error } = await db
    .from("bitacora_shares")
    .insert(input)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError(
        "CONFLICT",
        "Ya invitaste a esa persona",
        409,
        error.code,
      );
    }
    throw dbError("No se pudo crear la invitación", error.code);
  }
  return data;
}

export async function acceptShare(db: DbClient, id: string): Promise<void> {
  const { error } = await db.rpc("bitacora_accept_share", { share_id: id });

  if (error) {
    if (error.code === "P0002") {
      throw new AppError(
        "NOT_FOUND",
        "La invitación ya no existe",
        404,
        error.code,
      );
    }
    throw dbError("No se pudo aceptar la invitación", error.code);
  }
}

export async function deleteShare(db: DbClient, id: string): Promise<void> {
  const { error } = await db.from("bitacora_shares").delete().eq("id", id);

  if (error) throw dbError("No se pudo eliminar la invitación", error.code);
}

export async function getBrewPhotoPath(
  db: DbClient,
  id: string,
): Promise<string | null> {
  const { data, error } = await db
    .from("bitacora_brews")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();

  if (error) throw dbError("No se pudo leer la preparación", error.code);
  return data?.photo_path ?? null;
}

// --- Fotos (Supabase Storage, bucket privado) -----------------------------------------------

const PHOTO_BUCKET = "bitacora-photos";
const SIGNED_URL_SECONDS = 60 * 60;

export async function uploadPhoto(
  db: DbClient,
  path: string,
  file: File,
): Promise<void> {
  const { error } = await db.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error)
    throw new AppError(
      "STORAGE_ERROR",
      "No se pudo subir la foto",
      500,
      error.message,
    );
}

export async function removePhoto(db: DbClient, path: string): Promise<void> {
  const { error } = await db.storage.from(PHOTO_BUCKET).remove([path]);

  if (error)
    throw new AppError(
      "STORAGE_ERROR",
      "No se pudo borrar la foto",
      500,
      error.message,
    );
}

/** Mapa ruta -> URL firmada temporal. Las rutas que no se puedan firmar quedan fuera. */
export async function signPhotoUrls(
  db: DbClient,
  paths: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data, error } = await db.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error)
    throw new AppError(
      "STORAGE_ERROR",
      "No se pudieron leer las fotos",
      500,
      error.message,
    );

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error)
      urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function getBrew(
  db: DbClient,
  ownerId: string,
  id: string,
): Promise<BrewWithRelations | null> {
  const { data, error } = await db
    .from("bitacora_brews")
    .select(
      "*, product:bitacora_products(id, name, kind), tasting:bitacora_tastings(*)",
    )
    .eq("id", id)
    .eq("user_id", ownerId)
    .maybeSingle();

  if (error) throw dbError("No se pudo leer la preparación", error.code);
  return data as unknown as BrewWithRelations | null;
}

export async function updateBrewRow(
  db: DbClient,
  id: string,
  ownerId: string,
  input: Tables["bitacora_brews"]["Update"],
): Promise<BrewRow> {
  const { data, error } = await db
    .from("bitacora_brews")
    .update(input)
    .eq("id", id)
    .eq("user_id", ownerId)
    .select()
    .maybeSingle();

  if (error) throw dbError("No se pudo guardar la preparación", error.code);
  if (!data) throw new AppError("NOT_FOUND", "La preparación no existe", 404);
  return data;
}

export async function deleteTasting(
  db: DbClient,
  brewId: string,
): Promise<void> {
  const { error } = await db
    .from("bitacora_tastings")
    .delete()
    .eq("brew_id", brewId);

  if (error) throw dbError("No se pudo actualizar la cata", error.code);
}

/** Lugares usados (con repeticiones), para sugerirlos en el formulario. */
export async function listPlaces(db: DbClient, ownerId: string): Promise<string[]> {
  const { data, error } = await db
    .from("bitacora_brews")
    .select("place")
    .eq("user_id", ownerId)
    .not("place", "is", null)
    .order("brewed_at", { ascending: false })
    .limit(1000);

  if (error) throw dbError("No se pudieron leer los lugares", error.code);
  return data.flatMap((row) => (row.place ? [row.place] : []));
}
