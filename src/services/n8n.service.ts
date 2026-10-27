import { AppError } from "@/lib/api/response";
import { getN8nEnv } from "@/lib/env";

/**
 * Cliente saliente hacia webhooks de n8n.
 * Solo servidor: usa el secreto compartido en la cabecera `x-webhook-secret`.
 */

const REQUEST_TIMEOUT_MS = 10_000;

export interface N8nEventPayload {
  event: string;
  payload: Record<string, unknown>;
}

/**
 * Dispara un workflow de n8n cuyo nodo Webhook usa `path`.
 * Ej.: triggerWorkflow("template-ping", { event: "note.created", payload: { id } })
 */
export async function triggerWorkflow(
  path: string,
  body: N8nEventPayload,
): Promise<unknown> {
  const env = getN8nEnv();
  const base = env.N8N_WEBHOOK_BASE_URL.replace(/\/+$/, "");
  const url = `${base}/${encodeURIComponent(path)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new AppError("N8N_ERROR", `n8n respondió ${response.status}`, 502);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as unknown) : null;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("N8N_UNREACHABLE", "No se pudo contactar a n8n", 502);
  }
}
