"use client";

import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { logBrewAction, updateBrewAction } from "@/actions/bitacora.actions";
import { buttonClass, Field, FormMessage, inputClass } from "@/components/ui";
import {
  BREW_METHOD_SUGGESTIONS,
  KIND_LABEL,
  TASTING_SCORES,
  isKind,
} from "@/lib/bitacora/constants";
import { formatDuration, formatNumber } from "@/lib/bitacora/format";
import type { BrewView } from "@/services/bitacora.service";

export interface LastRecipe {
  method: string;
  dose_g: number | null;
  water_g: number | null;
  water_temp_c: number | null;
  steep_seconds: number | null;
  grind_setting: string | null;
  equipment: string | null;
  water_notes: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  kind: string;
  /** Última preparación de este producto, para repetir la receta. */
  last: LastRecipe | null;
}

interface BrewFormProps {
  products: ProductOption[];
  initialProductId?: string;
  /** Si viene, el formulario edita esa taza en vez de crear una nueva. */
  brew?: BrewView;
  /** Lugares ya usados, para autocompletar. */
  placeSuggestions?: string[];
}

interface Recipe {
  method: string;
  dose: string;
  water: string;
  temp: string;
  time: string;
  grind: string;
  equipment: string;
  waterNotes: string;
}

const EMPTY_RECIPE: Recipe = {
  method: "",
  dose: "",
  water: "",
  temp: "",
  time: "",
  grind: "",
  equipment: "",
  waterNotes: "",
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

function recipeFrom(last: LastRecipe | null): Recipe {
  if (!last) return EMPTY_RECIPE;
  return {
    method: last.method,
    dose: last.dose_g === null ? "" : String(last.dose_g),
    water: last.water_g === null ? "" : String(last.water_g),
    temp: last.water_temp_c === null ? "" : String(last.water_temp_c),
    time: last.steep_seconds === null ? "" : formatDuration(last.steep_seconds),
    grind: last.grind_setting ?? "",
    equipment: last.equipment ?? "",
    waterNotes: last.water_notes ?? "",
  };
}

const MAX_SIDE_PX = 1600;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Reduce y recomprime la foto (JPG) en el navegador; así una foto de celular pesa ~0,3-0,6 MB. */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) return file;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return file; // formato no decodificable en este navegador: se intenta con el original
  }
}

/** ISO -> valor para <input type="datetime-local"> en la hora del navegador. */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "250", "250 ml" o "1,5 L" -> ml (igual que en el servidor, para la proporción en vivo). */
function parseWaterMl(value: string): number {
  const match = /^([\d.,]+)\s*(l|lt|lts|litro|litros|ml)?$/i.exec(value.trim());
  if (!match) return Number.NaN;
  const amount = Number((match[1] ?? "").replace(",", "."));
  return (match[2] ?? "ml").toLowerCase() === "ml" ? amount : amount * 1000;
}

function parseDecimal(value: string): number {
  return Number(value.trim().replace(",", "."));
}

export function BrewForm({
  products,
  initialProductId,
  brew,
  placeSuggestions = [],
}: BrewFormProps) {
  const router = useRouter();
  const editing = brew !== undefined;
  const [state, formAction, pending] = useActionState(
    editing ? updateBrewAction : logBrewAction,
    null,
  );

  const initial = editing
    ? undefined
    : (products.find((product) => product.id === initialProductId) ??
      (products.length === 1 ? products[0] : undefined));

  const [productId, setProductId] = useState(
    brew?.product_id ?? initial?.id ?? "",
  );
  const [recipe, setRecipe] = useState<Recipe>(() =>
    brew ? recipeFrom(brew) : recipeFrom(initial?.last ?? null),
  );
  const [prefilled, setPrefilled] = useState(Boolean(initial?.last));

  // Fecha y hora: el valor visible es local; el que viaja al servidor es ISO (con zona horaria).
  const [brewedLocal, setBrewedLocal] = useState("");
  const [brewedIso, setBrewedIso] = useState(brew?.brewed_at ?? "");
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    // Se calcula tras montar para no desajustar la hidratación con la zona horaria del servidor.
    if (brew) setBrewedLocal(toLocalInputValue(brew.brewed_at));
  }, [brew]);

  function handleBrewedChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setBrewedLocal(value);
    const date = new Date(value);
    setBrewedIso(
      value === "" || Number.isNaN(date.getTime()) ? "" : date.toISOString(),
    );
  }

  const photoInput = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const original = input.files?.[0];
    setPhotoError(null);
    setPhotoPreview(null);
    if (!original) return;

    if (!original.type.startsWith("image/")) {
      input.value = "";
      setPhotoError("Elige una imagen (JPG, PNG o WebP).");
      return;
    }

    const file = await compressImage(original);
    if (file.size > MAX_UPLOAD_BYTES) {
      input.value = "";
      setPhotoError("La foto es demasiado pesada. Prueba con otra.");
      return;
    }

    // Reemplaza el archivo del input por la versión comprimida: es el que viaja con el formulario.
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    if (photoInput.current) photoInput.current.value = "";
    setPhotoPreview(null);
    setPhotoError(null);
  }

  useEffect(() => {
    if (state?.ok) {
      router.push("/bitacora");
    }
  }, [state, router]);

  const selected = products.find((product) => product.id === productId);
  const isTea = selected?.kind === "tea";
  const dryLabel = isTea ? "hebras de té" : "café";

  function handleProductChange(event: ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value;
    const next = products.find((product) => product.id === id);
    setProductId(id);
    if (editing) return; // al editar no se pisa la receta guardada
    setRecipe(recipeFrom(next?.last ?? null));
    setPrefilled(Boolean(next?.last));
  }

  const update =
    (key: keyof Recipe) => (event: ChangeEvent<HTMLInputElement>) => {
      setRecipe((current) => ({ ...current, [key]: event.target.value }));
    };

  const dose = parseDecimal(recipe.dose);
  const water = parseWaterMl(recipe.water);
  const ratio = dose > 0 && water > 0 ? water / dose : null;

  return (
    <form action={formAction} className="space-y-6">
      {brew ? <input type="hidden" name="id" value={brew.id} /> : null}
      <input type="hidden" name="brewed_at" value={brewedIso} />
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          1 · Qué preparaste
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Producto">
            <select
              name="product_id"
              required
              value={productId}
              onChange={handleProductChange}
              className={inputClass}
            >
              <option value="" disabled>
                Elige un producto
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {isKind(product.kind)
                    ? KIND_LABEL[product.kind]
                    : product.kind}{" "}
                  · {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Método (opcional)"
            hint="Elige de la lista o escribe el tuyo"
          >
            <input
              name="method"
              maxLength={60}
              list="brew-methods"
              value={recipe.method}
              onChange={update("method")}
              placeholder="Ej.: Prensa francesa"
              className={inputClass}
            />
            <datalist id="brew-methods">
              {BREW_METHOD_SUGGESTIONS.map((method) => (
                <option key={method} value={method} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field
          label="Lugar (opcional)"
          hint="Dónde la tomaste: en casa, nombre de la cafetería…"
        >
          <input
            name="place"
            list="brew-places"
            maxLength={120}
            placeholder="Ej.: Café Sorrento, Viña"
            defaultValue={brew?.place ?? ""}
            className={inputClass}
          />
          <datalist id="brew-places">
            {placeSuggestions.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>
        </Field>
        <Field
          label="Fecha y hora (opcional)"
          hint={
            editing
              ? "Cámbiala si la registraste otro día"
              : "Si la dejas vacía se usa ahora mismo"
          }
        >
          <input
            type="datetime-local"
            value={brewedLocal}
            onChange={handleBrewedChange}
            className={inputClass}
          />
        </Field>
        {brew?.photoUrl ? (
          <div className="flex items-end gap-3">
            {/* URL firmada y temporal de Supabase Storage. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brew.photoUrl}
              alt="Foto actual"
              className={`h-28 rounded-md object-cover ${removePhoto ? "opacity-40" : ""}`}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="remove_photo"
                checked={removePhoto}
                onChange={(event) => setRemovePhoto(event.target.checked)}
              />
              Quitar la foto actual
            </label>
          </div>
        ) : null}
        <Field
          label={
            brew?.photoUrl ? "Reemplazar foto (opcional)" : "Foto (opcional)"
          }
          hint="Del café, del paquete o del lugar. Se reduce sola antes de subirla."
        >
          <input
            ref={photoInput}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            onChange={handlePhotoChange}
            className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm dark:file:bg-stone-800`}
          />
        </Field>
        {photoError ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {photoError}
          </p>
        ) : null}
        {photoPreview ? (
          <div className="flex items-end gap-3">
            {/* Vista previa local (blob:), no hay nada que optimizar. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Vista previa de la foto"
              className="h-28 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="text-sm underline"
            >
              Quitar foto
            </button>
          </div>
        ) : null}
        {prefilled ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Rellené la receta con tu última preparación de este producto. Ajusta
            lo que cambió.
          </p>
        ) : null}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          2 · Receta (opcional)
        </legend>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Si probaste el café en otro lugar y no conoces las medidas, déjalo en
          blanco y pasa a la cata.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Cantidad de ${dryLabel} (gramos)`} hint="Opcional">
            <input
              name="dose_g"
              inputMode="decimal"
              value={recipe.dose}
              onChange={update("dose")}
              placeholder="Ej.: 15"
              className={inputClass}
            />
          </Field>
          <Field
            label="Cantidad de agua (ml)"
            hint="Opcional · en ml; también puedes escribir 1,5 L"
          >
            <input
              name="water_g"
              inputMode="decimal"
              value={recipe.water}
              onChange={update("water")}
              placeholder="Ej.: 250"
              className={inputClass}
            />
          </Field>
        </div>
        <p
          aria-live="polite"
          className="text-sm text-stone-600 dark:text-stone-400"
        >
          {ratio === null
            ? "Con café y agua calculo la proporción."
            : `Proporción: 1 de ${isTea ? "té" : "café"} por ${formatNumber(ratio)} de agua (1:${formatNumber(ratio)})`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temperatura del agua (°C)">
            <input
              name="water_temp_c"
              inputMode="decimal"
              value={recipe.temp}
              onChange={update("temp")}
              placeholder="Ej.: 93"
              className={inputClass}
            />
          </Field>
          <Field label="Tiempo" hint="Minutos y segundos, por ejemplo 3:30">
            <input
              name="steep_seconds"
              value={recipe.time}
              onChange={update("time")}
              placeholder="Ej.: 4:00"
              className={inputClass}
            />
          </Field>
        </div>
        <details className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
          <summary className="cursor-pointer text-sm font-medium">
            Más detalles de la receta (opcional)
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Molienda" hint="Ej.: 24 clicks, o 5,5 en el molino">
              <input
                name="grind_setting"
                maxLength={60}
                value={recipe.grind}
                onChange={update("grind")}
                className={inputClass}
              />
            </Field>
            <Field label="Equipo">
              <input
                name="equipment"
                maxLength={200}
                value={recipe.equipment}
                onChange={update("equipment")}
                className={inputClass}
              />
            </Field>
            <Field label="Agua usada" hint="Filtrada, mineral, de la llave…">
              <input
                name="water_notes"
                maxLength={200}
                value={recipe.waterNotes}
                onChange={update("waterNotes")}
                className={inputClass}
              />
            </Field>
          </div>
        </details>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          3 · Cómo salió
        </legend>
        <Field label="Valoración general">
          <select
            name="rating"
            defaultValue={brew?.rating ?? ""}
            className={inputClass}
          >
            <option value="">Sin valorar</option>
            {SCORE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)} ({value} de 5)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notas" hint="Lo que quieras recordar de esta taza">
          <textarea
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={brew?.notes ?? ""}
            className={inputClass}
          />
        </Field>

        <details
          open={Boolean(brew?.tasting)}
          className="rounded-lg border border-stone-200 p-4 dark:border-stone-800"
        >
          <summary className="cursor-pointer text-sm font-medium">
            Cata detallada (opcional)
          </summary>
          <div className="mt-4 space-y-4">
            <p className="text-xs text-stone-500">
              Puntúa de 1 (bajo) a 5 (alto) lo que notaste.
            </p>
            <div className="grid gap-4 sm:grid-cols-4">
              {TASTING_SCORES.map(({ key, label }) => (
                <Field key={key} label={label}>
                  <select
                    name={key}
                    defaultValue={brew?.tasting?.[key] ?? ""}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {SCORE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
            <Field
              label="Sabores que notaste"
              hint="Separados por coma: chocolate, caramelo, cítrico"
            >
              <input
                name="descriptors"
                defaultValue={brew?.tasting?.descriptors.join(", ") ?? ""}
                className={inputClass}
              />
            </Field>
            <Field label="Notas de cata">
              <textarea
                name="tasting_notes"
                rows={2}
                maxLength={2000}
                defaultValue={brew?.tasting?.notes ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </details>
      </fieldset>

      <FormMessage
        state={state}
        successText={editing ? "Cambios guardados." : "Taza registrada."}
      />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Guardando…" : editing ? "Guardar cambios" : "Guardar taza"}
      </button>
    </form>
  );
}
