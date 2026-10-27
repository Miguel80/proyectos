"use server";

import { revalidatePath } from "next/cache";
import { ok, toFailure, type ApiResult } from "@/lib/api/response";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { BrewRow, ProductRow } from "@/repositories/bitacora.repository";
import {
  createProduct,
  formDataToObject,
  logBrew,
  removeBrew,
  updateBrew,
} from "@/services/bitacora.service";

/** Server Actions de la Bitácora: validan sesión, delegan al servicio y devuelven JSON estándar. */

export async function createProductAction(
  _previous: ApiResult<ProductRow> | null,
  formData: FormData,
): Promise<ApiResult<ProductRow>> {
  try {
    const user = await requireUser();
    const db = await createClient();
    const product = await createProduct(db, user, formDataToObject(formData));

    revalidatePath("/bitacora", "layout");
    return ok(product);
  } catch (error) {
    return toFailure(error).failure;
  }
}

export async function logBrewAction(
  _previous: ApiResult<BrewRow> | null,
  formData: FormData,
): Promise<ApiResult<BrewRow>> {
  try {
    const user = await requireUser();
    const db = await createClient();
    const brew = await logBrew(db, user, formDataToObject(formData));

    revalidatePath("/bitacora", "layout");
    return ok(brew);
  } catch (error) {
    return toFailure(error).failure;
  }
}

/** Acción de formulario (sin estado): elimina una preparación. Los errores quedan en el log del servidor. */
export async function deleteBrewAction(formData: FormData): Promise<void> {
  try {
    await requireUser();
    const db = await createClient();
    await removeBrew(db, formData.get("id"));
    revalidatePath("/bitacora", "layout");
  } catch (error) {
    toFailure(error);
  }
}

export async function updateBrewAction(
  _previous: ApiResult<BrewRow> | null,
  formData: FormData,
): Promise<ApiResult<BrewRow>> {
  try {
    const user = await requireUser();
    const db = await createClient();
    const brew = await updateBrew(db, user, formDataToObject(formData));

    revalidatePath("/bitacora", "layout");
    return ok(brew);
  } catch (error) {
    return toFailure(error).failure;
  }
}
