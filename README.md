# template-project

Base para proyectos personales: **Next.js (App Router) + TypeScript estricto + Tailwind + Supabase SSR + n8n**, lista para desplegar en Vercel. Pensada para usarse como **GitHub Template** (Paso 1.2 de la Hoja de Ruta 2026).

## Arranque rápido

```bash
npm install
cp .env.example .env.local     # completa los valores
npm run dev                    # http://localhost:3000
```

Comprueba la configuración en `http://localhost:3000/api/health` (solo muestra booleanos, nunca valores).

## Estructura y responsabilidades

```
src/
  app/                  rutas (App Router) y route handlers
    api/health/         estado de configuración
    api/webhooks/n8n/   webhook ENTRANTE desde n8n (autenticado por secreto)
  actions/              Server Actions: capa delgada, devuelven ApiResult
  services/             lógica de negocio + cliente SALIENTE a n8n
  repositories/         acceso a datos (solo Supabase)
  lib/
    api/response.ts     contrato JSON estándar { ok, data | error } y AppError
    supabase/           clientes server / browser / middleware
    env.ts              validación de variables con zod (perezosa)
  types/database.ts     tipos de la BD (regenerar con `npm run db:types`)
supabase/migrations/    SQL versionado (RLS activado)
n8n/workflows/          workflows exportados (JSON)
```

Flujo: `Server Action / Route Handler → service → repository → Supabase`, y `service → n8n.service → webhook n8n`. Las capas no se saltan niveles.

## Supabase

1. Crea el proyecto y copia URL + clave *publishable* a `.env.local`.
2. Aplica `supabase/migrations/0001_init.sql` (CLI: `supabase db push`, o el SQL Editor).
3. Regenera tipos: `npm run db:types`.

La seguridad descansa en **RLS** (activado en el ejemplo). No uses la `service_role` en código que llegue al cliente; este template ni siquiera la incluye.

## n8n

```bash
# define N8N_WEBHOOK_SECRET en tu entorno (openssl rand -hex 32), luego:
npm run n8n:up                 # http://localhost:5678
```

Importa `n8n/workflows/template-ping.json`. Los webhooks usan la cabecera `x-webhook-secret` en ambos sentidos. El workflow de ejemplo no está probado contra una instancia real; ajústalo si tu versión de n8n difiere.

## Usar como GitHub Template

Repo en GitHub → *Settings → General → Template repository*. Luego *Use this template* para cada proyecto nuevo, y reemplaza `template-project` en `package.json` y `layout.tsx`.

## Despliegue en Vercel

Importa el repo y define las mismas variables de `.env.example` (Production y Preview). `N8N_WEBHOOK_BASE_URL` debe apuntar a una instancia n8n accesible desde Internet.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | servidor de desarrollo |
| `npm run check` | typecheck + lint |
| `npm run build` | build de producción |
| `npm run db:types` | tipos desde Supabase local |
| `npm run n8n:up` / `n8n:down` | n8n local en Docker |
