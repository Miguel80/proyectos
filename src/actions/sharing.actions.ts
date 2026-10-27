"use server";

import { revalidatePath } from "next/cache";
import { ok, toFailure, type ApiResult } from "@/lib/api/response";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { ShareRow } from "@/repositories/bitacora.repository";
import { formDataToObject } from "@/services/bitacora.service";
import { accept, invite, remove } from "@/services/sharing.service";

export async function inviteAction(
  _previous: ApiResult<ShareRow> | null,
  formData: FormData,
): Promise<ApiResult<ShareRow>> {
  try {
    const user = await requireUser();
    const db = await createClient();
    const share = await invite(db, user, formDataToObject(formData));

    revalidatePath("/bitacora", "layout");
    return ok(share);
  } catch (error) {
    return toFailure(error).failure;
  }
}

export async function acceptShareAction(formData: FormData): Promise<void> {
  try {
    await requireUser();
    const db = await createClient();
    await accept(db, formData.get("id"));
    revalidatePath("/bitacora", "layout");
  } catch (error) {
    toFailure(error);
  }
}

export async function removeShareAction(formData: FormData): Promise<void> {
  try {
    await requireUser();
    const db = await createClient();
    await remove(db, formData.get("id"));
    revalidatePath("/bitacora", "layout");
  } catch (error) {
    toFailure(error);
  }
}
