import { formatNumber } from "@/lib/bitacora/format";

/** Gráficos mínimos en HTML/SVG. Sin librerías: se renderizan en el servidor y respetan el tema. */

interface BarDatum {
  label: string;
  value: number;
}

/** Barras verticales (p. ej. tazas por semana). */
export function ColumnChart({
  data,
  ariaLabel,
}: {
  data: BarDatum[];
  ariaLabel: string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const last = data.length - 1;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="flex h-36 items-end gap-1.5"
    >
      {data.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1"
        >
          <span className="text-[10px] text-stone-500">
            {item.value > 0 ? item.value : ""}
          </span>
          <div
            className={`w-full rounded-t ${index === last ? "bg-amber-600" : "bg-amber-400/70 dark:bg-amber-500/50"}`}
            style={{
              height: `${(item.value / max) * 100}%`,
              minHeight: item.value > 0 ? 4 : 1,
            }}
          />
          <span className="h-3 whitespace-nowrap text-[9px] leading-3 text-stone-500">
            {index === 0 || index === last || index === Math.floor(last / 2)
              ? item.label
              : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

interface LinePoint {
  label: string;
  value: number | null;
}

/** Línea de valoración (1 a 5) por mes; los meses sin dato dejan un hueco. */
export function RatingLine({
  data,
  ariaLabel,
}: {
  data: LinePoint[];
  ariaLabel: string;
}) {
  const width = 300;
  const height = 120;
  const pad = { left: 18, right: 10, top: 10, bottom: 8 };
  const x = (index: number) =>
    pad.left +
    (data.length === 1
      ? 0
      : (index / (data.length - 1)) * (width - pad.left - pad.right));
  const y = (value: number) =>
    pad.top + ((5 - value) / 4) * (height - pad.top - pad.bottom);

  // Segmentos continuos de meses con dato.
  const segments: string[] = [];
  let current: string[] = [];
  data.forEach((point, index) => {
    if (point.value === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    } else {
      current.push(`${x(index)},${y(point.value)}`);
    }
  });
  if (current.length > 1) segments.push(current.join(" "));

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="w-full"
      >
        {[1, 3, 5].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-stone-200 dark:stroke-stone-800"
            />
            <text x={0} y={y(tick) + 3} className="fill-stone-500 text-[9px]">
              {tick}
            </text>
          </g>
        ))}
        {segments.map((points) => (
          <polyline
            key={points}
            points={points}
            fill="none"
            strokeWidth={2}
            className="stroke-amber-600"
          />
        ))}
        {data.map((point, index) =>
          point.value === null ? null : (
            <g key={point.label + index}>
              <circle
                cx={x(index)}
                cy={y(point.value)}
                r={3.5}
                className="fill-amber-600"
              />
              <text
                x={x(index)}
                y={y(point.value) - 7}
                textAnchor="middle"
                className="fill-stone-600 text-[9px] dark:fill-stone-300"
              >
                {formatNumber(point.value)}
              </text>
            </g>
          ),
        )}
      </svg>
      <div className="flex justify-between pl-[18px] pr-[10px] text-[10px] text-stone-500">
        {data.map((point, index) => (
          <span key={point.label + index}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

/** Barra horizontal de 0 a `max` con etiqueta y valor. */
export function MeterRow({
  label,
  value,
  max = 5,
  note,
}: {
  label: string;
  value: number | null;
  max?: number;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-sm">
      <span className="text-stone-700 dark:text-stone-300">{label}</span>
      <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800">
        {value === null ? null : (
          <div
            className="h-2 rounded-full bg-amber-600"
            style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          />
        )}
      </div>
      <span className="text-right text-xs text-stone-500">
        {value === null ? "—" : formatNumber(value)}
        {note ?? ""}
      </span>
    </div>
  );
}
