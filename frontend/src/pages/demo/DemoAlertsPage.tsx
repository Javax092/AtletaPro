import { useEffect, useState } from "react";
import { demoApi } from "../../api/demo";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";

export const DemoAlertsPage = () => {
  const [alerts, setAlerts] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void demoApi.alerts().then(setAlerts);
  }, []);

  if (alerts.length === 0) {
    return <LoadingState lines={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Alertas" subtitle="Fila comercialmente forte para demonstrar prevenção, gestão de risco e prontidão do elenco." eyebrow="Prioridades da comissão" />

      <Card title="Alertas recentes" subtitle="Cada alerta traz motivo e recomendação, reforçando valor prático imediato.">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={String(alert.id)} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{String(alert.title)}</p>
                  <p className="mt-1 text-sm text-slate-400">{String(alert.full_name)} • {String(alert.category)}</p>
                </div>
                <Badge tone={String(alert.severity) === "HIGH" ? "danger" : String(alert.severity) === "MEDIUM" ? "warning" : "success"}>{String(alert.severity)}</Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{String(alert.reason)}</p>
              <div className="mt-4 rounded-2xl border border-dashed border-[#edc17a]/30 bg-[#edc17a]/6 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#edc17a]">Recomendação</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">{String(alert.recommendation)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
