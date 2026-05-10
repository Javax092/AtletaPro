import { useEffect, useState } from "react";
import { demoApi } from "../../api/demo";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import type { DemoMatchIntelligenceResponse } from "../../types/demo";

export const DemoMatchIntelligencePage = () => {
  const [data, setData] = useState<DemoMatchIntelligenceResponse | null>(null);

  useEffect(() => {
    void demoApi.matchIntelligence().then(setData);
  }, []);

  if (!data) {
    return <LoadingState lines={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Intelligence"
        subtitle="Escalação convincente, reservas, indisponíveis e atletas sob observação para reforçar valor para comissão técnica."
        eyebrow={String(data.match.opponent)}
      />

      <Card title="Resumo executivo" subtitle="Explique rapidamente por que a plataforma sugere esse time para a próxima partida." actions={<Badge tone="success">Escalação recomendada</Badge>}>
        <p className="text-sm leading-8 text-slate-200">{data.recommendation.summary}</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Time ideal" subtitle="11 atletas recomendados para iniciar.">
          <div className="space-y-3">
            {data.recommendation.lineup_json.map((item) => (
              <div key={String(item.athlete_id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{String(item.full_name)}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(item.position)} • prontidão {String(item.readiness_score)}</p>
                  </div>
                  <Badge tone={String(item.risk_level) === "HIGH" ? "danger" : String(item.risk_level) === "MEDIUM" ? "warning" : "success"}>{String(item.risk_level)}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{String(item.justification)}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Reservas" subtitle="Banco pronto para leitura de cobertura por setor.">
            <div className="space-y-3">
              {data.recommendation.bench_json.map((item) => (
                <div key={String(item.athlete_id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{String(item.full_name)}</p>
                  <p className="mt-1 text-xs text-slate-400">{String(item.position)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Sob observação e indisponíveis" subtitle="Material ideal para falar de preservação e gestão de minutos.">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Watchlist</p>
                <div className="mt-3 space-y-3">
                  {data.recommendation.watchlist_json.map((item) => (
                    <div key={String(item.athlete_id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">{String(item.full_name)}</p>
                      <p className="mt-2 text-sm text-slate-300">{String(item.recommendation)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Indisponíveis</p>
                <div className="mt-3 space-y-3">
                  {data.recommendation.unavailable_json.map((item) => (
                    <div key={String(item.athlete_id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">{String(item.full_name)}</p>
                      <p className="mt-2 text-sm text-slate-300">{String(item.reason)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
