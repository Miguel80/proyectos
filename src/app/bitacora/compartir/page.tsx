import Link from "next/link";
import {
  acceptShareAction,
  removeShareAction,
} from "@/actions/sharing.actions";
import { InviteForm } from "@/components/invite-form";
import { buttonClass, cardClass, secondaryButtonClass } from "@/components/ui";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSharingOverview } from "@/services/sharing.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compartir · Bitácora Sensorial" };

const muted = "text-sm text-stone-600 dark:text-stone-400";

export default async function SharePage() {
  const user = await requireUserOrRedirect();
  const db = await createClient();
  const { sent, incoming, shared } = await getSharingOverview(db, user);

  return (
    <main className="space-y-10">
      {incoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Invitaciones recibidas
          </h2>
          <ul className="space-y-2">
            {incoming.map((share) => (
              <li
                key={share.id}
                className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}
              >
                <p className="text-sm">
                  <strong>{share.owner_email}</strong> quiere compartirte su
                  cuaderno (solo lectura).
                </p>
                <div className="flex gap-2">
                  <form action={acceptShareAction}>
                    <input type="hidden" name="id" value={share.id} />
                    <button type="submit" className={buttonClass}>
                      Aceptar
                    </button>
                  </form>
                  <form action={removeShareAction}>
                    <input type="hidden" name="id" value={share.id} />
                    <button type="submit" className={secondaryButtonClass}>
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Cuadernos que me compartieron
        </h2>
        {shared.length === 0 ? (
          <p className={muted}>Todavía nadie te ha compartido su cuaderno.</p>
        ) : (
          <ul className="space-y-2">
            {shared.map((share) => (
              <li
                key={share.id}
                className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}
              >
                <p className="text-sm font-medium">{share.owner_email}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/bitacora/de/${share.owner_id}`}
                    className={buttonClass}
                  >
                    Ver cuaderno
                  </Link>
                  <form action={removeShareAction}>
                    <input type="hidden" name="id" value={share.id} />
                    <button type="submit" className={secondaryButtonClass}>
                      Dejar de ver
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Compartir mi cuaderno
          </h2>
          <p className={muted}>
            La persona verá tus tazas, productos, lugares y catas, pero no podrá
            modificar nada. Puedes dejar de compartir cuando quieras.
          </p>
        </div>
        <InviteForm />

        {sent.length > 0 ? (
          <ul className="space-y-2">
            {sent.map((share) => (
              <li
                key={share.id}
                className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}
              >
                <div>
                  <p className="text-sm font-medium">{share.recipient_email}</p>
                  <p className="text-xs text-stone-500">
                    {share.status === "accepted"
                      ? "Aceptada: ya puede ver tu cuaderno"
                      : "Pendiente de aceptar"}
                  </p>
                </div>
                <form action={removeShareAction}>
                  <input type="hidden" name="id" value={share.id} />
                  <button type="submit" className={secondaryButtonClass}>
                    {share.status === "accepted"
                      ? "Dejar de compartir"
                      : "Cancelar"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
