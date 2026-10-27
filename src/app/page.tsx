import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">template-project</h1>
      <p className="text-stone-600 dark:text-stone-400">
        Next.js (App Router) + Supabase SSR + n8n + Tailwind. Base lista para clonar como
        GitHub Template.
      </p>
      <ul className="list-inside list-disc text-sm text-stone-600 dark:text-stone-400">
        <li>
          <Link href="/bitacora" className="underline">
            Bitácora Sensorial
          </Link>{" "}
          (café y té): requiere iniciar sesión
        </li>
        <li>
          Estado de configuración: <code>/api/health</code>
        </li>
        <li>
          Webhook entrante desde n8n: <code>POST /api/webhooks/n8n</code>
        </li>
      </ul>
    </main>
  );
}
