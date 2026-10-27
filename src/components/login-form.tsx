"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { signInAction } from "@/actions/auth.actions";
import { buttonClass, Field, FormMessage, inputClass } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/bitacora");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Correo">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Field label="Contraseña">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </Field>
      {state && !state.ok ? <FormMessage state={state} successText="" /> : null}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonClass} w-full`}
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
