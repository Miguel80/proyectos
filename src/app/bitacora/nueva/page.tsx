import Link from "next/link";
import { BrewForm, type ProductOption } from "@/components/brew-form";
import { cardClass } from "@/components/ui";
import { getPlaceSuggestions } from "@/services/insights.service";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOverview, getProducts } from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registrar taza · Bitácora Sensorial" };

interface NewBrewPageProps {
  searchParams: Promise<{ producto?: string }>;
}

export default async function NewBrewPage({ searchParams }: NewBrewPageProps) {
  const user = await requireUserOrRedirect();
  const { producto } = await searchParams;
  const db = await createClient();
  const [products, overview, placeSuggestions] = await Promise.all([
    getProducts(db, user.id),
    getOverview(db, user.id),
    getPlaceSuggestions(db, user.id),
  ]);

  // Última preparación por producto (las preparaciones vienen de la más reciente a la más antigua).
  const lastByProduct = new Map<string, ProductOption["last"]>();
  for (const brew of overview.brews) {
    if (!lastByProduct.has(brew.product_id)) {
      lastByProduct.set(brew.product_id, {
        method: brew.method,
        dose_g: brew.dose_g,
        water_g: brew.water_g,
        water_temp_c: brew.water_temp_c,
        steep_seconds: brew.steep_seconds,
        grind_setting: brew.grind_setting,
        equipment: brew.equipment,
        water_notes: brew.water_notes,
      });
    }
  }

  const options: ProductOption[] = products.map(({ id, name, kind }) => ({
    id,
    name,
    kind,
    last: lastByProduct.get(id) ?? null,
  }));

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Registrar taza</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Anota cómo la preparaste y cómo salió. Lo único obligatorio es elegir
          el producto.
        </p>
      </div>
      {products.length === 0 ? (
        <p
          className={`${cardClass} text-sm text-stone-600 dark:text-stone-400`}
        >
          Primero agrega un{" "}
          <Link href="/bitacora/productos" className="underline">
            producto
          </Link>{" "}
          (el café o té que vas a preparar).
        </p>
      ) : (
        <BrewForm
          products={options}
          initialProductId={producto}
          placeSuggestions={placeSuggestions}
        />
      )}
    </main>
  );
}
