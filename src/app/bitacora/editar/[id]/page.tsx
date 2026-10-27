import Link from "next/link";
import { notFound } from "next/navigation";
import { BrewForm, type ProductOption } from "@/components/brew-form";
import { getPlaceSuggestions } from "@/services/insights.service";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  attachPhotoUrls,
  getBrewForEdit,
  getProducts,
} from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar taza · Bitácora Sensorial" };

interface EditBrewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBrewPage({ params }: EditBrewPageProps) {
  const user = await requireUserOrRedirect();
  const { id } = await params;
  const db = await createClient();

  const raw = await getBrewForEdit(db, user.id, id).catch(() => null);
  if (!raw) notFound();

  const [brew] = await attachPhotoUrls(db, [raw]);
  const [products, placeSuggestions] = await Promise.all([
    getProducts(db, user.id),
    getPlaceSuggestions(db, user.id),
  ]);
  if (!brew) notFound();

  const options: ProductOption[] = products.map(
    ({ id: productId, name, kind }) => ({
      id: productId,
      name,
      kind,
      last: null,
    }),
  );

  return (
    <main className="space-y-6">
      <div>
        <Link href="/bitacora" className="text-sm text-stone-500 underline">
          ← Historial
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Editar taza
        </h1>
      </div>
      <BrewForm
        products={options}
        brew={brew}
        placeSuggestions={placeSuggestions}
      />
    </main>
  );
}
