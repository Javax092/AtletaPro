import { useState } from "react";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusPill } from "../components/ui/StatusPill";
import { squadAlerts } from "../mocks/alertsData";

const severityTone = {
  Crítico: "danger",
  Alto: "warning",
  Moderado: "info",
} as const;

export const AlertsPage = () => {
  const [severity, setSeverity] = useState("Todas");
  const [category, setCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState("Prioridade");

  const filtered = squadAlerts
    .filter((alert) => (severity === "Todas" ? true : alert.severity === severity))
    .filter((alert) => (category === "Todas" ? true : alert.category === category))
    .sort((left, right) => {
      if (sortBy === "Recente") {
        return right.createdAt.localeCompare(left.createdAt);
      }

      return right.priority - left.priority;
    });

  return (
    <PageContainer>
      <div className="space-y-3">
        <p className="text-eyebrow text-[#edc17a]">Alert Center</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Fila de alertas</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Tabela premium para decisão rápida, priorização do dia e demonstração comercial do valor preditivo da plataforma.
        </p>
      </div>

      <SectionCard title="Filtros de decisão" subtitle="Ordene por impacto e foque no que muda treino, minutos ou disponibilidade.">
        <div className="grid gap-3 md:grid-cols-3">
          <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="app-input">
            <option>Todas</option>
            <option>Crítico</option>
            <option>Alto</option>
            <option>Moderado</option>
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="app-input">
            <option>Todas</option>
            <option>Carga</option>
            <option>Recuperação</option>
            <option>Disponibilidade</option>
            <option>Risco agudo</option>
            <option>Match readiness</option>
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="app-input">
            <option>Prioridade</option>
            <option>Recente</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Alertas ativos" subtitle={`${filtered.length} itens no recorte atual.`}>
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div key={alert.id} className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-white">{alert.title}</p>
                    <StatusPill label={alert.severity} tone={severityTone[alert.severity]} />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{alert.category}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{alert.athleteName} • {new Date(alert.createdAt).toLocaleString("pt-BR")}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{alert.reason}</p>
                </div>
                <div className="max-w-md rounded-[1.2rem] border border-[#edc17a]/15 bg-[#edc17a]/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#f4d19a]">Recomendação</p>
                  <p className="mt-2 text-sm leading-7 text-slate-100">{alert.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
};
