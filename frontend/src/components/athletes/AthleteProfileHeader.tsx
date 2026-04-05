import type { SquadAthlete } from "../../types/athlete";
import { RiskBadge } from "../dashboard/RiskBadge";
import { StatusPill } from "../ui/StatusPill";

const riskLabel = (score: number) => (score >= 60 ? "Alto risco" : score >= 35 ? "Risco moderado" : "Baixo risco");
const statusTone = {
  "Disponível": "success",
  "Gerenciar carga": "warning",
  "Em retorno": "info",
  "Indisponível": "danger",
} as const;

export const AthleteProfileHeader = ({ athlete }: { athlete: SquadAthlete }) => (
  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(102,209,132,0.14),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(110,184,255,0.14),transparent_22%),linear-gradient(180deg,rgba(14,23,38,0.96),rgba(8,14,24,0.94))] p-6">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-eyebrow text-[#edc17a]">Athlete Profile</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{athlete.name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          #{athlete.number} • {athlete.position} • {athlete.age} anos • pé {athlete.dominantFoot.toLowerCase()}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill label={athlete.status} tone={statusTone[athlete.status]} />
        <RiskBadge label={riskLabel(athlete.riskScore)} />
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.05] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Prontidão</p>
          <p className="mt-1 text-xl font-semibold text-white">{athlete.readinessScore}</p>
        </div>
      </div>
    </div>
  </div>
);
