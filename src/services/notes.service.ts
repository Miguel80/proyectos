import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { isN8nConfigured } from "@/lib/env";
import {
  insertNote,
  listNotes,
  type DbClient,
  type NoteRow,
} from "@/repositories/notes.repository";
import { triggerWorkflow } from "@/services/n8n.service";

/**
 * Lógica de negocio. Orquesta repositorio y n8n, sin conocer HTTP ni cookies.
 */

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  body: z.string().trim().max(5000).optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export async function getNotes(db: DbClient): Promise<NoteRow[]> {
  return listNotes(db);
}

export async function createNote(
  db: DbClient,
  user: User,
  input: unknown,
): Promise<NoteRow> {
  const parsed = createNoteSchema.parse(input);

  const note = await insertNote(db, {
    user_id: user.id,
    title: parsed.title,
    body: parsed.body ?? null,
  });

  // La notificación a n8n es best-effort: un fallo no debe revertir la creación.
  if (isN8nConfigured()) {
    try {
      await triggerWorkflow("template-ping", {
        event: "note.created",
        payload: { id: note.id, title: note.title },
      });
    } catch (error) {
      console.error("[notes] n8n no notificado", error);
    }
  }

  return note;
}
