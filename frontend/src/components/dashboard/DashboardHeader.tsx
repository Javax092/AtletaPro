import { RefreshCw, CalendarRange } from "lucide-react";
import { StatusPill } from "../ui/StatusPill";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  periodLabel: string;
  teamStatus: string;
}

export const DashboardHeader = ({ title, subtitle, periodLabel, teamStatus }: DashboardHeaderProps) => (
  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(237,193,122,0.18),transparent_25%),radial-gradient(circle_at_80%_20%,rgba(102,209,132,0.12),transparent_24%),linear-gradient(180deg,rgba(14,23,38,0.96),rgba(8,14,24,0.94))] p-6 shadow-panel">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        <p className="text-eyebrow text-[#edc17a]">Performance Command Center</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <CalendarRange className="h-4 w-4" />
            Período
          </div>
          <p className="mt-2 text-sm font-medium text-white">{periodLabel}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status do elenco</p>
          <div className="mt-2">
            <StatusPill label={teamStatus} tone="success" />
          </div>
        </div>
        <button className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.07]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
            <RefreshCw className="h-4 w-4" />
            Atualização
          </div>
          <p className="mt-2 text-sm font-medium text-white">Atualizar leitura</p>
        </button>
      </div>
    </div>
  </div>
);
