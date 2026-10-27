"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { logBrewAction } from "@/actions/bitacora.actions";
import { buttonClass, Field, FormMessage, inputClass } from "@/components/ui";
import {
  BREW_METHOD_SUGGESTIONS,
  KIND_LABEL,
  TASTING_SCORES,
  isKind,
} from "@/lib/bitacora/constants";

export interface ProductOption {
  id: string;
  name: string;
  kind: string;
}

interface BrewFormProps {
  products: ProductOption[];
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5] as const;

export function BrewForm({ products }: BrewFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(logBrewAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/bitacora");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Producto">
          <select name="product_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Elige un producto
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {isKind(product.kind) ? KIND_LABEL[product.kind] : product.kind} · {product.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Método">
          <input name="method" required maxLength={60} list="brew-methods" className={inputClass} />
          <datalist id="brew-methods">
            {BREW_METHOD_SUGGESTIONS.map((method) => (
              <option key={method} value={method} />
            ))}
          </datalist>
        </Field>
        <Field label="Dosis (g)" hint="Café o hebras secas">
          <input name="dose_g" type="number" step="0.1" min="0.1" required className={inputClass} />
        </Field>
        <Field label="Agua (g)">
          <input name="water_g" type="number" step="1" min="1" required className={inputClass} />
        </Field>
        <Field label="Temperatura del agua (°C)">
          <input name="water_temp_c" type="number" step="0.5" min="0" max="100" className={inputClass} />
        </Field>
        <Field label="Tiempo (segundos)" hint="Extracción o infusión">
          <input name="steep_seconds" type="number" step="1" min="1" className={inputClass} />
        </Field>
        <Field label="Molienda" hint="Ej.: 24 clicks, 5.5 en el molino">
          <input name="grind_setting" maxLength={60} className={inputClass} />
        </Field>
        <Field label="Equipo">
          <input name="equipment" maxLength={200} className={inputClass} />
        </Field>
        <Field label="Agua (notas)" hint="Filtrada, mineral, dureza…">
          <input name="water_notes" maxLength={200} className={inputClass} />
        </Field>
        <Field label="Valoración general">
          <select name="rating" defaultValue="" className={inputClass}>
            <option value="">—</option>
            {SCORE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <details className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <summary className="cursor-pointer text-sm font-medium">Cata (opcional)</summary>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {TASTING_SCORES.map(({ key, label }) => (
              <Field key={key} label={label}>
                <select name={key} defaultValue="" className={inputClass}>
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
          <Field label="Descriptores" hint="Separados por coma: cítrico, chocolate, jazmín">
            <input name="descriptors" className={inputClass} />
          </Field>
          <Field label="Notas de cata">
            <textarea name="tasting_notes" rows={2} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      </details>

      <Field label="Notas">
        <textarea name="notes" rows={2} maxLength={2000} className={inputClass} />
      </Field>

      <FormMessage state={state} successText="Preparación registrada." />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Guardando…" : "Registrar preparación"}
      </button>
    </form>
  );
}
