"use client";

import { useActionState } from "react";
import { inviteAction } from "@/actions/sharing.actions";
import { buttonClass, Field, FormMessage, inputClass } from "@/components/ui";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteAction, null);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Correo de la persona" hint="Debe usar este mismo correo para entrar a la Bitácora">
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="ejemplo@correo.com"
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} successText="Invitación enviada. Quedará pendiente hasta que la acepte." />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Enviando…" : "Invitar"}
      </button>
    </form>
  );
}
