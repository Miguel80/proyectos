import Link from "next/link";
import { BrewCard } from "@/components/brew-card";
import { buttonClass, cardClass } from "@/components/ui";
import { formatDateTime } from "@/lib/bitacora/format";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOverview } from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preparaciones · Bitácora Sensorial" };

export default async function BitacoraPage() {
  const user = await requireUserOrRedirect();
  const db = await createClient();
  const { brews, stats } = await getOverview(db, user.id);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-stone-500">Tazas</dt>
            <dd className="text-xl font-semibold">{stats.shown}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Valoración media</dt>
            <dd className="text-xl font-semibold">
              {stats.averageRating === null
                ? "—"
                : stats.averageRating.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Última</dt>
            <dd className="text-xl font-semibold">
              {stats.lastBrewAt === null
                ? "—"
                : formatDateTime(stats.lastBrewAt)}
            </dd>
          </div>
        </dl>
        <Link href="/bitacora/nueva" className={buttonClass}>
          Registrar taza
        </Link>
      </div>

      {brews.length === 0 ? (
        <p
          className={`${cardClass} text-sm text-stone-600 dark:text-stone-400`}
        >
          Aún no hay tazas registradas. Empieza agregando tu primer{" "}
          <Link href="/bitacora/productos" className="underline">
            café o té
          </Link>{" "}
          y luego registra la taza.
        </p>
      ) : (
        <ul className="space-y-3">
          {brews.map((brew) => (
            <BrewCard key={brew.id} brew={brew} />
          ))}
        </ul>
      )}
    </main>
  );
}
