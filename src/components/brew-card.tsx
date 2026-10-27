import Link from "next/link";
import { deleteBrewAction } from "@/actions/bitacora.actions";
import { cardClass, secondaryButtonClass } from "@/components/ui";
import { isKind, KIND_LABEL } from "@/lib/bitacora/constants";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatStars,
  formatVolume,
} from "@/lib/bitacora/format";
import type { BrewView } from "@/services/bitacora.service";

interface BrewCardProps {
  brew: BrewView;
  /** En cuadernos compartidos solo se puede mirar. */
  readOnly?: boolean;
}

export function BrewCard({ brew, readOnly = false }: BrewCardProps) {
  return (
    <li className={cardClass}>
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
          <p className="text-xs text-stone-500">
            {formatDateTime(brew.brewed_at)}
            {brew.place ? ` · ${brew.place}` : ""}
          </p>
        </div>
        {brew.rating !== null ? (
          <p
            aria-label={`Valoración ${brew.rating} de 5`}
            className="text-amber-600"
          >
            {formatStars(brew.rating)}
          </p>
        ) : null}
      </div>

      {brew.photoUrl ? (
        <a
          href={brew.photoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-fit"
        >
          {/* URL firmada y temporal de Supabase Storage: no pasa por el optimizador de next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brew.photoUrl}
            alt={`Foto de ${brew.product?.name ?? "la taza"}`}
            loading="lazy"
            className="h-40 w-full max-w-xs rounded-md object-cover"
          />
        </a>
      ) : null}

      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
        {[
          brew.method === "Sin especificar" ? null : brew.method,
          brew.dose_g !== null && brew.water_g !== null
            ? `${formatNumber(brew.dose_g)} g de ${brew.product?.kind === "tea" ? "té" : "café"} + ${formatVolume(brew.water_g)} de agua`
            : null,
          brew.ratio !== null ? `1:${formatNumber(brew.ratio)}` : null,
          brew.water_temp_c !== null
            ? `${formatNumber(brew.water_temp_c)} °C`
            : null,
          brew.steep_seconds !== null
            ? formatDuration(brew.steep_seconds)
            : null,
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

      {brew.notes ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {brew.notes}
        </p>
      ) : null}

      {readOnly ? null : (
        <div className="mt-3 flex gap-2">
          {brew.product_id ? (
            <Link
              href={`/bitacora/nueva?producto=${brew.product_id}`}
              className={secondaryButtonClass}
            >
              Repetir
            </Link>
          ) : null}
          <Link
            href={`/bitacora/editar/${brew.id}`}
            className={secondaryButtonClass}
          >
            Editar
          </Link>
          <form action={deleteBrewAction}>
            <input type="hidden" name="id" value={brew.id} />
            <button type="submit" className={secondaryButtonClass}>
              Eliminar
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
