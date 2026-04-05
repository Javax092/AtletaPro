import { Sparkles } from "lucide-react";
import type { DashboardInsight } from "../../types/dashboard";
import { SectionCard } from "../ui/SectionCard";

export const InsightCard = ({ insights }: { insights: DashboardInsight[] }) => (
  <SectionCard
    title="Sistema de Insight"
    subtitle="Leitura executiva automática para comissão técnica, preparação física e direção."
    actions={
      <div className="inline-flex items-center gap-2 rounded-full border border-[#edc17a]/20 bg-[#edc17a]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f6d39d]">
        <Sparkles className="h-3.5 w-3.5" />
        AI signal
      </div>
    }
  >
    <div className="space-y-4">
      {insights.map((insight) => (
        <div key={insight.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-semibold text-white">{insight.title}</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">{insight.description}</p>
        </div>
      ))}
    </div>
  </SectionCard>
);
