import Link from "next/link";
import { InsightCard } from "@/components/insight-card";
import { ColumnChart, MeterRow, RatingLine } from "@/components/insight-charts";
import { cardClass } from "@/components/ui";
import { isKind, KIND_LABEL } from "@/lib/bitacora/constants";
import { formatNumber } from "@/lib/bitacora/format";
import type { Insights, Period } from "@/services/insights.service";

const PERIOD_LABEL: Record<Period, string> = {
  "30": "30 días",
  "90": "90 días",
  todo: "Todo",
};
const muted = "text-sm text-stone-600 dark:text-stone-400";
const stars = (value: number | null) =>
  value === null ? "—" : `★ ${formatNumber(value)}`;

interface SummaryViewProps {
  insights: Insights;
  period: Period;
}

export function SummaryView({ insights, period }: SummaryViewProps) {
  const {
    totals,
    topProducts,
    places,
    placeSplit,
    weekly,
    monthly,
    profile,
    flavors,
  } = insights;

  const hasProfile = profile.some((item) => item.average !== null);
  const hasMonthly =
    monthly.filter((item) => item.averageRating !== null).length >= 2;

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        <nav
          aria-label="Período"
          className="flex gap-1 rounded-md border border-stone-200 p-1 text-sm dark:border-stone-800"
        >
          {(Object.keys(PERIOD_LABEL) as Period[]).map((item) => (
            <Link
              key={item}
              href={`/bitacora/resumen?periodo=${item}`}
              aria-current={item === period ? "page" : undefined}
              className={`rounded px-3 py-1 ${
                item === period
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
              }`}
            >
              {PERIOD_LABEL[item]}
            </Link>
          ))}
        </nav>
      </div>

      {totals.brews === 0 ? (
        <p className={`${cardClass} ${muted}`}>
          No hay tazas en este período.{" "}
          <Link href="/bitacora/nueva" className="underline">
            Registra una
          </Link>{" "}
          o prueba con otro período.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Tazas", String(totals.brews)],
              ["Valoración media", stars(totals.averageRating)],
              ["Lugares", String(totals.places)],
              ["Últimos 7 días", String(totals.lastSevenDays)],
            ].map(([label, value]) => (
              <div key={label} className={cardClass}>
                <dt className="text-xs text-stone-500">{label}</dt>
                <dd className="text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 md:grid-cols-2">
            <InsightCard
              title="Tus mejores cafés y tés"
              subtitle="Valoración media, con al menos 2 tazas valoradas"
            >
              {topProducts.length === 0 ? (
                <p className={muted}>
                  Aún faltan tazas valoradas: valora al menos 2 del mismo
                  producto.
                </p>
              ) : (
                <ol className="space-y-3">
                  {topProducts.map((product, index) => (
                    <li
                      key={product.productId}
                      className="flex items-center gap-3"
                    >
                      <span className="w-5 text-sm text-stone-500">
                        {index + 1}.
                      </span>
                      {product.photoUrl ? (
                        // URL firmada y temporal de Supabase Storage.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.photoUrl}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {isKind(product.kind)
                            ? KIND_LABEL[product.kind]
                            : product.kind}{" "}
                          · {product.ratedBrews}{" "}
                          {product.ratedBrews === 1
                            ? "taza valorada"
                            : "tazas valoradas"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-amber-600">
                        {stars(product.averageRating)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              {insights.unrankedProducts > 0 && topProducts.length > 0 ? (
                <p className="mt-3 text-xs text-stone-500">
                  {insights.unrankedProducts} producto(s) sin ranking por tener
                  menos de 2 tazas valoradas.
                </p>
              ) : null}
            </InsightCard>

            <InsightCard
              title="Dónde los pruebas"
              subtitle="Lugares con más tazas"
            >
              {places.length === 0 ? (
                <p className={muted}>
                  Anota el lugar al registrar una taza para ver esta sección.
                </p>
              ) : (
                <ul className="space-y-2">
                  {places.map((place) => (
                    <li
                      key={place.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate">{place.name}</span>
                      <span className="shrink-0 text-xs text-stone-500">
                        {place.brews} {place.brews === 1 ? "taza" : "tazas"} ·{" "}
                        <span className="font-semibold text-amber-600">
                          {stars(place.averageRating)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-stone-500">
                En casa: {placeSplit.home} · Fuera: {placeSplit.away} · Sin
                lugar: {placeSplit.unknown}
              </p>
            </InsightCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <InsightCard title="Tazas por semana" subtitle="Últimas 12 semanas">
              <ColumnChart
                data={weekly.map((item) => ({
                  label: item.label,
                  value: item.brews,
                }))}
                ariaLabel="Tazas por semana en las últimas 12 semanas"
              />
            </InsightCard>
            <InsightCard
              title="Valoración por mes"
              subtitle="Promedio de los últimos 6 meses"
            >
              {hasMonthly ? (
                <RatingLine
                  data={monthly.map((item) => ({
                    label: item.label,
                    value: item.averageRating,
                  }))}
                  ariaLabel="Valoración media por mes"
                />
              ) : (
                <p className={muted}>
                  Se necesitan tazas valoradas en al menos 2 meses distintos.
                </p>
              )}
            </InsightCard>
          </div>

          <InsightCard
            title="Tu perfil de sabor"
            subtitle="Promedio de tus catas detalladas (1 a 5)"
          >
            {hasProfile ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  {profile.map((item) => (
                    <MeterRow
                      key={item.key}
                      label={item.label}
                      value={item.average}
                    />
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs text-stone-500">
                    Sabores que más repites
                  </p>
                  {flavors.length === 0 ? (
                    <p className={muted}>
                      Anota sabores en la cata para verlos aquí.
                    </p>
                  ) : (
                    <p className="flex flex-wrap gap-1.5">
                      {flavors.map((flavor) => (
                        <span
                          key={flavor.name}
                          className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        >
                          {flavor.name}{" "}
                          <span className="opacity-60">×{flavor.count}</span>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className={muted}>
                Aún no hay catas detalladas. Al registrar una taza, abre
                &quot;Cata detallada&quot; y puntúa lo que notes.
              </p>
            )}
          </InsightCard>
        </>
      )}
    </main>
  );
}
