import type { ReactNode } from "react";
import type { ApiResult } from "@/lib/api/response";

export const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-stone-700";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800";

export const cardClass =
  "rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

function detailMessages(details: unknown): string[] {
  if (!details || typeof details !== "object") return [];
  return Object.entries(details as Record<string, unknown>).flatMap(([field, value]) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").map((m) => `${field}: ${m}`)
      : [],
  );
}

interface FormMessageProps {
  state: ApiResult<unknown> | null;
  successText: string;
}

/** Muestra el resultado estándar { ok, data | error } de una Server Action. */
export function FormMessage({ state, successText }: FormMessageProps) {
  if (state === null) return null;

  if (state.ok) {
    return (
      <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        {successText}
      </p>
    );
  }

  const extra = detailMessages(state.error.details);
  return (
    <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
      <p>{state.error.message}</p>
      {extra.length > 0 ? (
        <ul className="mt-1 list-inside list-disc text-xs">
          {extra.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
