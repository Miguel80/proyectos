import { CoffeeLandscape } from "@/components/coffee-landscape";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar · Bitácora Sensorial" };

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-6 py-12">
      <CoffeeLandscape />
      <div className="relative w-full max-w-sm space-y-6 rounded-2xl bg-stone-50/90 p-8 text-stone-900 shadow-2xl backdrop-blur dark:bg-stone-950/85 dark:text-stone-100">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">Café · Té</p>
          <h1 className="text-2xl font-semibold tracking-tight">Bitácora Sensorial</h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">Inicia sesión para ver tu cuaderno.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
