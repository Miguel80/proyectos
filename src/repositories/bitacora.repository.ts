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

export async function listProducts(db: DbClient): Promise<ProductRow[]> {
  const { data, error } = await db
    .from("bitacora_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw dbError("No se pudieron leer los productos", error.code);
  return data;
}

export async function insertProduct(db: DbClient, input: ProductInsert): Promise<ProductRow> {
  const { data, error } = await db.from("bitacora_products").insert(input).select().single();

  if (error) throw dbError("No se pudo crear el producto", error.code);
  return data;
}

export async function listBrews(db: DbClient, limit: number): Promise<BrewWithRelations[]> {
  const { data, error } = await db
    .from("bitacora_brews")
    .select("*, product:bitacora_products(id, name, kind), tasting:bitacora_tastings(*)")
    .order("brewed_at", { ascending: false })
    .limit(limit);

  if (error) throw dbError("No se pudieron leer las preparaciones", error.code);
  return data as unknown as BrewWithRelations[];
}

export async function insertBrew(db: DbClient, input: BrewInsert): Promise<BrewRow> {
  const { data, error } = await db.from("bitacora_brews").insert(input).select().single();

  if (error) throw dbError("No se pudo registrar la preparación", error.code);
  return data;
}

export async function upsertTasting(db: DbClient, input: TastingInsert): Promise<TastingRow> {
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
