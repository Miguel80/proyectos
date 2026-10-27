import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/actions/auth.actions";
import { secondaryButtonClass } from "@/components/ui";

interface BitacoraLayoutProps {
  children: ReactNode;
}

export default function BitacoraLayout({ children }: BitacoraLayoutProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-6">
          <Link href="/bitacora" className="text-lg font-semibold tracking-tight">
            Bitácora Sensorial
          </Link>
          <nav className="flex gap-4 text-sm text-stone-600 dark:text-stone-400">
            <Link href="/bitacora" className="hover:text-stone-900 dark:hover:text-stone-100">
              Preparaciones
            </Link>
            <Link href="/bitacora/nueva" className="hover:text-stone-900 dark:hover:text-stone-100">
              Nueva
            </Link>
            <Link href="/bitacora/productos" className="hover:text-stone-900 dark:hover:text-stone-100">
              Productos
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
