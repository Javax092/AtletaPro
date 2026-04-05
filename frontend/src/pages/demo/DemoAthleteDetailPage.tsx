import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { demoApi } from "../../api/demo";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import type { DemoAthleteDetailResponse } from "../../types/demo";

export const DemoAthleteDetailPage = () => {
  const { athleteId = "" } = useParams();
  const [data, setData] = useState<DemoAthleteDetailResponse | null>(null);

  useEffect(() => {
    void demoApi.athleteDetail(athleteId).then(setData);
  }, [athleteId]);

  if (!data) {
    return <LoadingState lines={6} />;
  }

  const athlete = data.athlete;
  const profile = data.profile;
  const risk = data.latestRisk;

  return (
    <div className="space-y-6">
      <PageHeader title={String(athlete.full_name)} subtitle={String(profile?.summary ?? "Perfil inteligente do atleta para demo comercial.")} eyebrow={String(athlete.position)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-label-muted">Status</p><p className="mt-3 text-xl font-semibold text-white">{String(athlete.availability_status)}</p></Card>
        <Card className="p-5"><p className="text-label-muted">Risco</p><p className="mt-3 text-xl font-semibold text-white">{String(risk?.risk_level ?? "LOW")}</p></Card>
        <Card className="p-5"><p className="text-label-muted">Score físico</p><p className="mt-3 text-xl font-semibold text-white">{Number(profile?.physical_score ?? 0).toFixed(1)}</p></Card>
        <Card className="p-5"><p className="text-label-muted">Disponibilidade</p><p className="mt-3 text-xl font-semibold text-white">{Number(profile?.availability_score ?? 0).toFixed(1)}</p></Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card title="Resumo automático" subtitle="Texto curto e convincente para staff, gestão e comercial." actions={<Badge tone="info">{String(profile?.trend_label ?? "demo")}</Badge>}>
          <p className="text-sm leading-8 text-slate-200">{String(profile?.summary ?? "")}</p>
        </Card>

        <Card title="Leitura de risco" subtitle="Explica o risco atual com linguagem simples e vendável.">
          <p className="text-sm leading-8 text-slate-200">{String(risk?.explanation ?? "Sem risco calculado.")}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Últimas sessões" subtitle="Histórico recente para mostrar coerência operacional.">
          <div className="space-y-3">
            {data.recentLoads.slice(0, 8).map((item) => (
              <div key={String(item.recorded_at)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{String(item.session_type)}</p>
                  <p className="text-xs text-slate-400">{String(item.recorded_at).slice(0, 10)}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Carga {Number(item.workload ?? 0).toFixed(0)} • Fadiga {Number(item.fatigue_level ?? 0).toFixed(1)} • Sono {Number(item.sleep_hours ?? 0).toFixed(1)}h
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Alertas do atleta" subtitle="Material pronto para conversa com comissão técnica e preparador físico.">
          <div className="space-y-3">
            {data.recentAlerts.length > 0 ? data.recentAlerts.map((item) => (
              <div key={String(item.id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{String(item.title)}</p>
                  <Badge tone={String(item.severity) === "HIGH" ? "danger" : String(item.severity) === "MEDIUM" ? "warning" : "success"}>
                    {String(item.severity)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{String(item.reason)}</p>
              </div>
            )) : <p className="text-sm text-slate-400">Sem alertas recentes.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};
