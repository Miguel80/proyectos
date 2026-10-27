import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/actions/auth.actions";
import { secondaryButtonClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

/** Invitaciones recibidas sin responder. Nunca rompe el layout: ante cualquier fallo devuelve 0. */
async function countPendingInvites(): Promise<number> {
  try {
    const db = await createClient();
    const { data } = await db.auth.getUser();
    const email = data.user?.email?.toLowerCase();
    if (!data.user || !email) return 0;

    const { count } = await db
      .from("bitacora_shares")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("recipient_email", email);
    return count ?? 0;
  } catch {
    return 0;
  }
}

interface BitacoraLayoutProps {
  children: ReactNode;
}

export default async function BitacoraLayout({
  children,
}: BitacoraLayoutProps) {
  const pending = await countPendingInvites();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-6">
          <Link
            href="/bitacora"
            className="text-lg font-semibold tracking-tight"
          >
            Bitácora Sensorial
          </Link>
          <nav className="flex gap-4 text-sm text-stone-600 dark:text-stone-400">
            <Link
              href="/bitacora"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Historial
            </Link>
            <Link
              href="/bitacora/resumen"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Resumen
            </Link>
            <Link
              href="/bitacora/nueva"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Registrar taza
            </Link>
            <Link
              href="/bitacora/productos"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Mis cafés y tés
            </Link>
            <Link
              href="/bitacora/compartir"
              className="hover:text-stone-900 dark:hover:text-stone-100"
            >
              Compartir
              {pending > 0 ? (
                <span
                  aria-label={`${pending} invitaciones pendientes`}
                  className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white"
                >
                  {pending}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={secondaryButtonClass}>
            Salir
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
