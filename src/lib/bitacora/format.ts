const dateTimeFormat = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

const numberFormat = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 1,
});

/** 16.67 -> "16,7" */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Dosis tal como se midió: "15 g", "2 cucharadas soperas (~10 g)", "1 cucharadita (~2 g)". */
export function formatDose(
  amount: number | null,
  unit: string | null,
  grams: number | null,
): string | null {
  if (unit === "tsp" || unit === "tbsp") {
    if (amount === null)
      return grams === null ? null : `${numberFormat.format(grams)} g`;
    const plural = amount !== 1;
    const name =
      unit === "tsp"
        ? plural
          ? "cucharaditas"
          : "cucharadita"
        : plural
          ? "cucharadas soperas"
          : "cucharada sopera";
    const approx = grams === null ? "" : ` (~${numberFormat.format(grams)} g)`;
    return `${numberFormat.format(amount)} ${name}${approx}`;
  }
  const value = amount ?? grams;
  return value === null ? null : `${numberFormat.format(value)} g`;
}

/** Agua en ml (1 g = 1 ml): 250 -> "250 ml", 1500 -> "1,5 L". */
export function formatVolume(ml: number): string {
  return ml >= 1000
    ? `${numberFormat.format(ml / 1000)} L`
    : `${numberFormat.format(ml)} ml`;
}

/** 150 -> "2:30" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 4 -> "★★★★☆" */
export function formatStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}
