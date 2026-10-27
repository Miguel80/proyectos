import { SummaryView } from "@/components/summary-view";
import { requireUserOrRedirect } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getInsights, parsePeriod } from "@/services/insights.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumen · Bitácora Sensorial" };

interface SummaryPageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const user = await requireUserOrRedirect();
  const period = parsePeriod((await searchParams).periodo);
  const db = await createClient();
  const insights = await getInsights(db, user.id, period);

  return <SummaryView insights={insights} period={period} />;
}
