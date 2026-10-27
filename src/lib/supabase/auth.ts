import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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

/** Para páginas (Server Components): redirige a /login si no hay sesión. Defensa adicional al middleware. */
export async function requireUserOrRedirect(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect("/login");
  }
  return data.user;
}
