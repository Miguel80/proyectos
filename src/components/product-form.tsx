"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "@/actions/bitacora.actions";
import { buttonClass, Field, FormMessage, inputClass } from "@/components/ui";
import {
  KIND_LABEL,
  KINDS,
  ROAST_LEVEL_LABEL,
  ROAST_LEVELS,
  TEA_TYPE_LABEL,
  TEA_TYPES,
  isKind,
  type Kind,
} from "@/lib/bitacora/constants";

export function ProductForm() {
  const [state, formAction, pending] = useActionState(createProductAction, null);
  const [kind, setKind] = useState<Kind>("coffee");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Café o té?">
          <select
            name="kind"
            value={kind}
            onChange={(event) => {
              const value = event.target.value;
              if (isKind(value)) setKind(value);
            }}
            className={inputClass}
          >
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {KIND_LABEL[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre" hint="Como lo reconoces: marca, origen o nombre del paquete">
          <input
            name="name"
            required
            maxLength={120}
            placeholder={kind === "coffee" ? "Ej.: Café 3 Corações" : "Ej.: Dian Hong"}
            className={inputClass}
          />
        </Field>
      </div>

      <details className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <summary className="cursor-pointer text-sm font-medium">Más detalles (opcional)</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="País de origen">
            <input name="origin_country" maxLength={80} className={inputClass} />
          </Field>
          <Field label="Región">
            <input name="region" maxLength={80} className={inputClass} />
          </Field>
          <Field label="Productor">
            <input name="producer" maxLength={120} className={inputClass} />
          </Field>
          <Field label={kind === "coffee" ? "Variedad" : "Cultivar"}>
            <input name="variety" maxLength={120} className={inputClass} />
          </Field>
          <Field label={kind === "coffee" ? "Proceso (lavado, natural…)" : "Oxidación o procesado"}>
            <input name="process" maxLength={120} className={inputClass} />
          </Field>
          {kind === "tea" ? (
            <Field label="Tipo de té">
              <select name="tea_type" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {TEA_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {TEA_TYPE_LABEL[value]}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Nivel de tueste">
                <select name="roast_level" defaultValue="" className={inputClass}>
                  <option value="">—</option>
                  {ROAST_LEVELS.map((value) => (
                    <option key={value} value={value}>
                      {ROAST_LEVEL_LABEL[value]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de tueste">
                <input name="roast_date" type="date" className={inputClass} />
              </Field>
            </>
          )}
          <Field label="Fecha de compra">
            <input name="purchased_on" type="date" className={inputClass} />
          </Field>
          <Field label="Dónde lo compraste">
            <input name="supplier" maxLength={120} className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Notas">
            <textarea name="notes" rows={2} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      </details>

      <FormMessage state={state} successText="Producto guardado." />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Guardando…" : "Guardar producto"}
      </button>
    </form>
  );
}
