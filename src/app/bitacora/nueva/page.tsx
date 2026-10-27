import Link from "next/link";
import { BrewForm } from "@/components/brew-form";
import { cardClass } from "@/components/ui";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva preparación · Bitácora Sensorial" };

export default async function NewBrewPage() {
  await requireUserOrRedirect();
  const db = await createClient();
  const products = await getProducts(db);

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Nueva preparación</h1>
      {products.length === 0 ? (
        <p className={`${cardClass} text-sm text-stone-600 dark:text-stone-400`}>
          Primero agrega un{" "}
          <Link href="/bitacora/productos" className="underline">
            producto
          </Link>{" "}
          (el café o té que vas a preparar).
        </p>
      ) : (
        <BrewForm products={products.map(({ id, name, kind }) => ({ id, name, kind }))} />
      )}
    </main>
  );
}
