import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { AppError, jsonError, jsonOk } from "@/lib/api/response";
import { getN8nEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  event: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).default({}),
});

/** Compara en tiempo constante; hashea primero para igualar longitudes. */
function secretsMatch(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Webhook entrante desde n8n. Autenticado por secreto compartido (`x-webhook-secret`).
 * Aquí solo se valida y se enruta; la lógica de negocio vive en src/services.
 */
export async function POST(request: NextRequest) {
  try {
    const env = getN8nEnv();

    if (!secretsMatch(request.headers.get("x-webhook-secret"), env.N8N_WEBHOOK_SECRET)) {
      throw new AppError("UNAUTHORIZED", "Secreto de webhook inválido", 401);
    }

    const body = bodySchema.parse(await request.json());

    switch (body.event) {
      case "template.ping":
        return jsonOk({ received: body.event, pong: true });
      default:
        throw new AppError("UNKNOWN_EVENT", `Evento no soportado: ${body.event}`, 400);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(new AppError("INVALID_JSON", "El cuerpo no es JSON válido", 400));
    }
    return jsonError(error);
  }
}
