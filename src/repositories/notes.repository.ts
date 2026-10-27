import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/api/response";
import type { Database } from "@/types/database";

/**
 * Capa de acceso a datos: solo habla con Supabase.
 * No contiene reglas de negocio ni conoce HTTP/n8n.
 */

export type DbClient = SupabaseClient<Database>;
export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];

export async function listNotes(db: DbClient): Promise<NoteRow[]> {
  const { data, error } = await db
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error)
    throw new AppError(
      "DB_ERROR",
      "No se pudieron leer las notas",
      500,
      error.code,
    );
  return data;
}

export async function insertNote(
  db: DbClient,
  note: NoteInsert,
): Promise<NoteRow> {
  const { data, error } = await db.from("notes").insert(note).select().single();

  if (error)
    throw new AppError("DB_ERROR", "No se pudo crear la nota", 500, error.code);
  return data;
}
