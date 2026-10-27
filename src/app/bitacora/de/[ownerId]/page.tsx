import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BrewCard } from "@/components/brew-card";
import { cardClass } from "@/components/ui";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOverview } from "@/services/bitacora.service";
import { findAcceptedShare } from "@/services/sharing.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuaderno compartido · Bitácora Sensorial" };

interface SharedNotebookPageProps {
  params: Promise<{ ownerId: string }>;
}

export default async function SharedNotebookPage({
  params,
}: SharedNotebookPageProps) {
  const user = await requireUserOrRedirect();
  const parsed = z.uuid().safeParse((await params).ownerId);
  if (!parsed.success) notFound();

  const db = await createClient();
  const share = await findAcceptedShare(db, user, parsed.data);
  if (!share) notFound();

  const { brews } = await getOverview(db, parsed.data);

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/bitacora/compartir"
          className="text-sm text-stone-500 underline"
        >
          ← Compartidos
        </Link>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Cuaderno de {share.owner_email}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Solo lectura.
        </p>
      </div>
      {brews.length === 0 ? (
        <p
          className={`${cardClass} text-sm text-stone-600 dark:text-stone-400`}
        >
          Todavía no tiene tazas registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {brews.map((brew) => (
            <BrewCard key={brew.id} brew={brew} readOnly />
          ))}
        </ul>
      )}
    </main>
  );
}
