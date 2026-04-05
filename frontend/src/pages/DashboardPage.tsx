import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { MetricCard } from "../components/dashboard/MetricCard";
import { ChartCard } from "../components/dashboard/ChartCard";
import { InsightCard } from "../components/dashboard/InsightCard";
import { AlertsPanel } from "../components/dashboard/AlertsPanel";
import { ReadinessPanel } from "../components/dashboard/ReadinessPanel";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionCard } from "../components/ui/SectionCard";
import { dashboardSummary } from "../mocks/dashboardData";
import { squadAlerts } from "../mocks/alertsData";

const pieColors = ["#6eb8ff", "#66d184", "#edc17a", "#ff8a80"];
const barColors = ["#ff7d7d", "#f5c46b", "#6eb8ff"];

export const DashboardPage = () => (
  <PageContainer>
    <DashboardHeader
      title="Performance Command Center"
      subtitle="Painel executivo para gerir carga, risco, disponibilidade, prontidão competitiva e leitura preditiva do elenco com padrão de clube profissional."
      periodLabel={dashboardSummary.periodLabel}
      teamStatus={dashboardSummary.teamStatus}
    />

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardSummary.metrics.map((card) => (
        <MetricCard key={card.id} card={card} />
      ))}
    </section>

    <section className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Evolução da carga nos últimos 7 dias" subtitle="Volume consolidado do elenco com leitura diária do microciclo.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dashboardSummary.loadTrend}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#718197" tickLine={false} axisLine={false} />
            <YAxis stroke="#718197" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Line type="monotone" dataKey="value" stroke="#edc17a" strokeWidth={3} dot={{ r: 3, fill: "#edc17a" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Evolução do risco do elenco" subtitle="Leitura agregada do risco competitivo ao longo da semana.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dashboardSummary.squadRiskTrend}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#718197" tickLine={false} axisLine={false} />
            <YAxis stroke="#718197" tickLine={false} axisLine={false} domain={[0, 0.6]} />
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Line type="monotone" dataKey="value" stroke="#ff7d7d" strokeWidth={3} dot={{ r: 3, fill: "#ff7d7d" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Distribuição do elenco por posição" subtitle="Estrutura do plantel monitorado para decisões técnicas e comerciais.">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dashboardSummary.positionDistribution}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={96}
              paddingAngle={5}
            >
              {dashboardSummary.positionDistribution.map((entry, index) => (
                <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Severidade dos alertas" subtitle="Volume de prioridades para staff e departamento médico.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardSummary.alertSeverity}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#718197" tickLine={false} axisLine={false} />
            <YAxis stroke="#718197" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
              {dashboardSummary.alertSeverity.map((entry, index) => (
                <Cell key={entry.label} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 5 atletas com maior risco" subtitle="Casos que entram primeiro na conversa do dia.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={dashboardSummary.topRiskAthletes}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" stroke="#718197" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={120} stroke="#718197" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Bar dataKey="riskScore" fill="#ff7d7d" radius={[0, 12, 12, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 5 atletas com melhor prontidão" subtitle="Base mais preparada para sustentar intensidade competitiva.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={dashboardSummary.topReadinessAthletes}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" stroke="#718197" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={120} stroke="#718197" tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }} />
            <Bar dataKey="readinessScore" fill="#66d184" radius={[0, 12, 12, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <InsightCard insights={dashboardSummary.recentInsights} />
        <ReadinessPanel readiness={dashboardSummary.readiness} />
      </div>

      <div className="space-y-5">
        <AlertsPanel alerts={squadAlerts.slice(0, 4)} />
        <SectionCard title="Atletas em observação" subtitle="Quem pede monitoramento ativo nas próximas 24h.">
          <div className="space-y-3">
            {dashboardSummary.watchlist.map((name) => (
              <div key={name} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                {name}
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Atletas indisponíveis" subtitle="Indisponibilidade atual para competição.">
          <div className="space-y-3">
            {dashboardSummary.unavailable.map((name) => (
              <div key={name} className="rounded-[1.35rem] border border-rose-400/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {name}
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Atletas mais prontos" subtitle="Melhores combinações de prontidão e estabilidade.">
          <div className="space-y-3">
            {dashboardSummary.mostReady.map((name) => (
              <div key={name} className="rounded-[1.35rem] border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {name}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </section>
  </PageContainer>
);
