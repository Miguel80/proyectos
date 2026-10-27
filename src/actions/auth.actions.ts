"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError, ok, toFailure, type ApiResult } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email({ error: "Correo inválido" }),
  password: z.string().min(1, "Ingresa tu contraseña").max(200),
});

/** Inicio de sesión con correo y contraseña. El mensaje de error no revela si el correo existe. */
export async function signInAction(
  _previous: ApiResult<null> | null,
  formData: FormData,
): Promise<ApiResult<null>> {
  try {
    const { email, password } = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Correo o contraseña incorrectos",
        401,
      );
    }

    return ok(null);
  } catch (error) {
    return toFailure(error).failure;
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
