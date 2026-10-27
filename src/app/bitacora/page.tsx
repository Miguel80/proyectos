import Link from "next/link";
import { deleteBrewAction } from "@/actions/bitacora.actions";
import { buttonClass, cardClass, secondaryButtonClass } from "@/components/ui";
import { isKind, KIND_LABEL } from "@/lib/bitacora/constants";
import { formatDateTime, formatDuration, formatNumber, formatStars } from "@/lib/bitacora/format";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getOverview } from "@/services/bitacora.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preparaciones · Bitácora Sensorial" };

export default async function BitacoraPage() {
  await requireUserOrRedirect();
  const db = await createClient();
  const { brews, stats } = await getOverview(db);

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
              {stats.averageRating === null ? "—" : stats.averageRating.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Última</dt>
            <dd className="text-xl font-semibold">
              {stats.lastBrewAt === null ? "—" : formatDateTime(stats.lastBrewAt)}
            </dd>
          </div>
        </dl>
        <Link href="/bitacora/nueva" className={buttonClass}>
          Registrar taza
        </Link>
      </div>

      {brews.length === 0 ? (
        <p className={`${cardClass} text-sm text-stone-600 dark:text-stone-400`}>
          Aún no hay tazas registradas. Empieza agregando tu primer{" "}
          <Link href="/bitacora/productos" className="underline">
            café o té
          </Link>{" "}
          y luego registra la taza.
        </p>
      ) : (
        <ul className="space-y-3">
          {brews.map((brew) => (
            <li key={brew.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {brew.product ? brew.product.name : "Producto eliminado"}
                    {brew.product && isKind(brew.product.kind) ? (
                      <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                        {KIND_LABEL[brew.product.kind]}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone-500">{formatDateTime(brew.brewed_at)}</p>
                </div>
                {brew.rating !== null ? (
                  <p aria-label={`Valoración ${brew.rating} de 5`} className="text-amber-600">
                    {formatStars(brew.rating)}
                  </p>
                ) : null}
              </div>

              <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                {[
                  brew.method === "Sin especificar" ? null : brew.method,
                  brew.dose_g !== null && brew.water_g !== null
                    ? `${formatNumber(brew.dose_g)} g de ${brew.product?.kind === "tea" ? "té" : "café"} + ${formatNumber(brew.water_g)} g de agua`
                    : null,
                  brew.ratio !== null ? `1:${formatNumber(brew.ratio)}` : null,
                  brew.water_temp_c !== null ? `${formatNumber(brew.water_temp_c)} °C` : null,
                  brew.steep_seconds !== null ? formatDuration(brew.steep_seconds) : null,
                  brew.grind_setting ? `molienda ${brew.grind_setting}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos de receta"}
              </p>

              {brew.tasting && brew.tasting.descriptors.length > 0 ? (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {brew.tasting.descriptors.map((descriptor) => (
                    <span
                      key={descriptor}
                      className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    >
                      {descriptor}
                    </span>
                  ))}
                </p>
              ) : null}

              {brew.notes ? <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{brew.notes}</p> : null}

              <div className="mt-3 flex gap-2">
                {brew.product_id ? (
                  <Link href={`/bitacora/nueva?producto=${brew.product_id}`} className={secondaryButtonClass}>
                    Repetir
                  </Link>
                ) : null}
                <form action={deleteBrewAction}>
                  <input type="hidden" name="id" value={brew.id} />
                  <button type="submit" className={secondaryButtonClass}>
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
