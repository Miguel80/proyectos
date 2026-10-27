"use server";

import { revalidatePath } from "next/cache";
import { ok, toFailure, type ApiResult } from "@/lib/api/response";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createNote } from "@/services/notes.service";
import type { NoteRow } from "@/repositories/notes.repository";

/** Server Action: capa delgada que valida sesión, delega al servicio y devuelve JSON estándar. */
export async function createNoteAction(formData: FormData): Promise<ApiResult<NoteRow>> {
  try {
    const user = await requireUser();
    const db = await createClient();

    const note = await createNote(db, user, {
      title: formData.get("title"),
      body: formData.get("body") ?? undefined,
    });

    revalidatePath("/");
    return ok(note);
  } catch (error) {
    return toFailure(error).failure;
  }
}
