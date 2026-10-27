import type { ReactNode } from "react";
import { cardClass } from "@/components/ui";

interface InsightCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function InsightCard({ title, subtitle, children }: InsightCardProps) {
  return (
    <section className={`${cardClass} space-y-3`}>
      <header>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="text-xs text-stone-500">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
