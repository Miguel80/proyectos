import Link from "next/link";
import { CoffeeLandscape } from "@/components/coffee-landscape";

export const metadata = {
  title: "Bitácora Sensorial · café y té",
  description: "Un cuaderno para registrar cómo preparas y cómo saben tu café y tu té.",
};

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col justify-between overflow-hidden bg-stone-950 text-stone-50">
      <CoffeeLandscape />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start gap-6 px-6 pt-24 sm:pt-32">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Café · Té</p>
        <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Bitácora Sensorial
        </h1>
        <p className="max-w-lg text-lg text-stone-100/90">
          Anota cómo preparas cada taza, qué sabores encuentras y cuál volverías a repetir. Un cuaderno para quienes
          disfrutan el café con calma.
        </p>
        <div>
          <Link
            href="/bitacora"
            className="inline-block rounded-full bg-amber-200 px-6 py-3 text-sm font-semibold text-stone-900 shadow-lg transition hover:bg-amber-100"
          >
            Entrar a mi bitácora
          </Link>
        </div>
      </div>
      <footer className="relative px-6 py-4 text-center text-xs text-stone-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        Acceso privado · cada persona ve solo sus propios registros
      </footer>
    </main>
  );
}
