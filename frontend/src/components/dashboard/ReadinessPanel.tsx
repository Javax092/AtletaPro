import { SectionCard } from "../ui/SectionCard";
import type { ReadinessSummary } from "../../types/dashboard";

export const ReadinessPanel = ({ readiness }: { readiness: ReadinessSummary }) => (
  <SectionCard title="Match Readiness" subtitle="Síntese para o próximo compromisso competitivo.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-[1.4rem] border border-emerald-400/15 bg-emerald-400/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/80">Elenco apto</p>
        <p className="mt-3 text-3xl font-semibold text-white">{readiness.fitCount}</p>
      </div>
      <div className="rounded-[1.4rem] border border-amber-300/15 bg-amber-300/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber-100/80">A preservar</p>
        <p className="mt-3 text-3xl font-semibold text-white">{readiness.preserveCount}</p>
      </div>
      <div className="rounded-[1.4rem] border border-sky-400/15 bg-sky-400/10 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-sky-100/80">Em retorno</p>
        <p className="mt-3 text-3xl font-semibold text-white">{readiness.returnCount}</p>
      </div>
    </div>
    <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Recomendação geral</p>
      <p className="mt-3 text-sm leading-7 text-slate-200">{readiness.recommendation}</p>
    </div>
  </SectionCard>
);
