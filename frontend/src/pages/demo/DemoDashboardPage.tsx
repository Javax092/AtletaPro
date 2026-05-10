import { useEffect, useState } from "react";
import { demoApi } from "../../api/demo";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import type { DemoDashboardResponse, DemoOverviewResponse } from "../../types/demo";

export const DemoDashboardPage = () => {
  const [overview, setOverview] = useState<DemoOverviewResponse | null>(null);
  const [dashboard, setDashboard] = useState<DemoDashboardResponse | null>(null);

  useEffect(() => {
    void Promise.all([demoApi.overview(), demoApi.dashboard()]).then(([overviewData, dashboardData]) => {
      setOverview(overviewData);
      setDashboard(dashboardData);
    });
  }, []);

  if (!overview || !dashboard) {
    return <LoadingState lines={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Comercial"
        subtitle="Visão executiva pronta para mostrar disponibilidade, risco, carga e prontidão do elenco em poucos minutos."
        eyebrow={overview.clubName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} accentClassName="from-[#edc17a]/30" />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Narrativa comercial" subtitle="Mensagens curtas para conduzir a apresentação com clareza." actions={<Badge tone="success">Pronto para vender</Badge>}>
          <div className="space-y-3">
            {overview.commercialStory.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Severidade dos alertas" subtitle="Mostra ao cliente como a plataforma organiza prioridades do elenco.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.alertSeverityDistribution}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="severity" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#edc17a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Evolução da carga 7d" subtitle="Volume médio da semana para mostrar rotina, controle e consistência do trabalho.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.weeklyLoadSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line dataKey="avgWorkload" stroke="#66d184" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Tendência de recuperação" subtitle="Fadiga consolidada para reforçar o argumento de prevenção e gestão de minutos.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.recoveryTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line dataKey="avgFatigue" stroke="#ff7d7d" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Top 5 maior risco" subtitle="Atletas que entram primeiro na conversa com comissão e preparação física.">
          <div className="space-y-3">
            {dashboard.topRisks.map((item) => (
              <div key={String(item.athlete_id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{String(item.full_name)}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(item.position)}</p>
                  </div>
                  <Badge tone={String(item.risk_level) === "HIGH" ? "danger" : "warning"}>{Math.round(Number(item.risk_probability) * 100)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Alertas recentes" subtitle="Leitura objetiva e visualmente forte para mostrar valor percebido imediato.">
          <div className="space-y-3">
            {dashboard.recentAlerts.map((alert) => (
              <div key={String(alert.id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{String(alert.title)}</p>
                    <p className="mt-1 text-xs text-slate-400">{String(alert.full_name)} • {String(alert.category)}</p>
                  </div>
                  <Badge tone={String(alert.severity) === "HIGH" ? "danger" : String(alert.severity) === "MEDIUM" ? "warning" : "success"}>
                    {String(alert.severity)}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{String(alert.reason)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
