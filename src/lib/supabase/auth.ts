import type { User } from "@supabase/supabase-js";
import { AppError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";

/** Devuelve el usuario autenticado o lanza AppError 401. Usa getUser(), nunca getSession(), en servidor. */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AppError("UNAUTHORIZED", "Debes iniciar sesión", 401);
  }
  return data.user;
}
