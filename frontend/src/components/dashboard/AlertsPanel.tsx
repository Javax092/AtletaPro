import { Link } from "react-router-dom";
import type { SquadAlert } from "../../types/alert";
import { SectionCard } from "../ui/SectionCard";
import { StatusPill } from "../ui/StatusPill";

const severityTone = {
  Crítico: "danger",
  Alto: "warning",
  Moderado: "info",
} as const;

export const AlertsPanel = ({ alerts }: { alerts: SquadAlert[] }) => (
  <SectionCard title="Alertas recentes" subtitle="Sinais prontos para decisão rápida e comunicação com o staff.">
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          to="/alerts"
          className="block rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{alert.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{alert.athleteName} • {alert.category}</p>
            </div>
            <StatusPill label={alert.severity} tone={severityTone[alert.severity]} />
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-300">{alert.reason}</p>
        </Link>
      ))}
    </div>
  </SectionCard>
);
