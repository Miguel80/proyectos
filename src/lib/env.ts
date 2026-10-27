import { z } from "zod";

/**
 * Validación de variables de entorno.
 * Se evalúa de forma perezosa (al llamar a la función) para que `next build`
 * no falle en páginas que no necesitan estas variables.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const n8nSchema = z.object({
  N8N_WEBHOOK_BASE_URL: z.string().url(),
  N8N_WEBHOOK_SECRET: z
    .string()
    .min(32, "N8N_WEBHOOK_SECRET debe tener al menos 32 caracteres"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type N8nEnv = z.infer<typeof n8nSchema>;

/** Las variables NEXT_PUBLIC_* deben referenciarse de forma estática para que Next las inyecte. */
export function getPublicEnv(): PublicEnv {
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

/** Solo servidor. No importar desde componentes cliente. */
export function getN8nEnv(): N8nEnv {
  return n8nSchema.parse({
    N8N_WEBHOOK_BASE_URL: process.env.N8N_WEBHOOK_BASE_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  });
}

export function isSupabaseConfigured(): boolean {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }).success;
}

export function isN8nConfigured(): boolean {
  return n8nSchema.safeParse({
    N8N_WEBHOOK_BASE_URL: process.env.N8N_WEBHOOK_BASE_URL,
    N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  }).success;
}
