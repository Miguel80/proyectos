import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { AppError } from "@/lib/api/response";
import type { DbClient } from "@/repositories/notes.repository";
import {
  acceptShare,
  deleteShare,
  insertShare,
  listShares,
  type ShareRow,
} from "@/repositories/bitacora.repository";

/** Compartir cuadernos: invitación por correo, aceptación del invitado y acceso de solo lectura. */

const inviteSchema = z.object({
  email: z.string({ error: "Escribe un correo" }).trim().toLowerCase().pipe(z.email({ error: "Correo no válido" })),
});

const idSchema = z.uuid();

export interface SharingOverview {
  /** Invitaciones que hice (pendientes o aceptadas). */
  sent: ShareRow[];
  /** Invitaciones recibidas que aún no acepto. */
  incoming: ShareRow[];
  /** Cuadernos de otras personas que ya acepté. */
  shared: ShareRow[];
}

export async function getSharingOverview(db: DbClient, user: User): Promise<SharingOverview> {
  const email = (user.email ?? "").toLowerCase();
  const rows = await listShares(db);

  return {
    sent: rows.filter((row) => row.owner_id === user.id),
    incoming: rows.filter(
      (row) => row.owner_id !== user.id && row.status === "pending" && row.recipient_email === email,
    ),
    shared: rows.filter(
      (row) => row.owner_id !== user.id && row.status === "accepted" && row.recipient_id === user.id,
    ),
  };
}

export async function invite(db: DbClient, user: User, input: unknown): Promise<ShareRow> {
  const { email } = inviteSchema.parse(input);
  const ownEmail = (user.email ?? "").toLowerCase();

  if (ownEmail === "") {
    throw new AppError("BAD_REQUEST", "Tu cuenta no tiene correo", 400);
  }
  if (email === ownEmail) {
    throw new AppError("BAD_REQUEST", "No puedes invitarte a ti mismo", 400);
  }

  return insertShare(db, { owner_id: user.id, owner_email: ownEmail, recipient_email: email });
}

export async function accept(db: DbClient, id: unknown): Promise<void> {
  await acceptShare(db, idSchema.parse(id));
}

/** Revoca (dueño), rechaza o deja de seguir (invitado): en todos los casos se borra la invitación. */
export async function remove(db: DbClient, id: unknown): Promise<void> {
  await deleteShare(db, idSchema.parse(id));
}

/** Devuelve la invitación aceptada que da acceso al cuaderno de `ownerId`, o null. */
export async function findAcceptedShare(db: DbClient, user: User, ownerId: string): Promise<ShareRow | null> {
  const { shared } = await getSharingOverview(db, user);
  return shared.find((row) => row.owner_id === ownerId) ?? null;
}
