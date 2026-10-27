import { jsonOk } from "@/lib/api/response";
import { isN8nConfigured, isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Estado de configuración. Solo expone booleanos, nunca valores. */
export function GET() {
  return jsonOk({
    status: "ok",
    time: new Date().toISOString(),
    config: {
      supabase: isSupabaseConfigured(),
      n8n: isN8nConfigured(),
    },
  });
}
