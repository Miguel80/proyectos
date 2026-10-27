import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar · template-project" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">Acceso personal a la Bitácora Sensorial.</p>
      </div>
      <LoginForm />
    </main>
  );
}
