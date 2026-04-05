import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { alertsApi } from "../../api/alerts";
import { athleteApi } from "../../api/athletes";
import { dashboardApi } from "../../api/dashboard";
import { performanceApi } from "../../api/performance";
import { PerformanceChart } from "../../components/charts/PerformanceChart";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { TableWrapper } from "../../components/common/TableWrapper";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useNotifications } from "../../hooks/useNotifications";
import type { Athlete } from "../../types/athlete";
import type { AlertItem } from "../../types/alerts";
import type { DashboardMetricPoint, DashboardResponse, DashboardTrendPoint } from "../../types/dashboard";
import { METRICS_CSV_HEADERS, type MetricsImportReport, type RiskAnalysis } from "../../types/performance";

const EMPTY_DASHBOARD: DashboardResponse = { metrics: [], risks: [] };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;

    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

const getRiskBadgeClassName = (riskLevel: string) => {
  if (riskLevel === "HIGH") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  if (riskLevel === "MEDIUM") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value);

const roundMetric = (value: number | null | undefined, digits = 0) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
};

const buildTrendData = (metrics: DashboardMetricPoint[]): DashboardTrendPoint[] => {
  const grouped = new Map<
    string,
    {
      workloadTotal: number;
      fatigueTotal: number;
      workloadCount: number;
      fatigueCount: number;
      metricsCount: number;
      firstRecordedAt: string;
    }
  >();

  for (const metric of metrics) {
    const key = metric.recordedAt.slice(0, 10);
    const current = grouped.get(key) ?? {
      workloadTotal: 0,
      fatigueTotal: 0,
      workloadCount: 0,
      fatigueCount: 0,
      metricsCount: 0,
      firstRecordedAt: metric.recordedAt,
    };

    current.metricsCount += 1;

    if (typeof metric.workload === "number") {
      current.workloadTotal += metric.workload;
      current.workloadCount += 1;
    }

    if (typeof metric.fatigueLevel === "number") {
      current.fatigueTotal += metric.fatigueLevel;
      current.fatigueCount += 1;
    }

    if (metric.recordedAt < current.firstRecordedAt) {
      current.firstRecordedAt = metric.recordedAt;
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([, item]) => ({
      date: item.firstRecordedAt,
      label: formatDate(item.firstRecordedAt),
      avgWorkload: roundMetric(item.workloadTotal / Math.max(item.workloadCount, 1), 1) ?? 0,
      avgFatigue: roundMetric(item.fatigueTotal / Math.max(item.fatigueCount, 1), 1) ?? 0,
      metricsCount: item.metricsCount,
    }));
};

const buildLatestMetrics = (metrics: DashboardMetricPoint[]) =>
  [...metrics]
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())
    .slice(0, 6);

const buildTopRisks = (risks: RiskAnalysis[]) =>
  [...risks]
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, 6);

const buildHighRiskAthletes = (risks: RiskAnalysis[]) => {
  const uniqueAthletes = new Set(
    risks.filter((risk) => risk.riskLevel === "HIGH").map((risk) => risk.athleteId),
  );

  return uniqueAthletes.size;
};

const buildRecentMetricsCount = (metrics: DashboardMetricPoint[]) => {
  if (metrics.length === 0) {
    return 0;
  }

  const latestTimestamp = Math.max(...metrics.map((metric) => new Date(metric.recordedAt).getTime()));
  const cutoff = latestTimestamp - 1000 * 60 * 60 * 24 * 7;

  return metrics.filter((metric) => new Date(metric.recordedAt).getTime() >= cutoff).length;
};

const buildAverageRiskScore = (risks: RiskAnalysis[]) => {
  if (risks.length === 0) {
    return 0;
  }

  return Math.round(risks.reduce((total, risk) => total + risk.riskScore, 0) / risks.length);
};

const buildEmptyState = (title: string, description: string) => <EmptyState title={title} description={description} />;

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <LoadingState lines={4} cardHeight="h-32" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="app-loading-block h-[26rem]" />
      <div className="app-loading-block h-[26rem]" />
    </div>
  </div>
);

export const DashboardPage = () => {
  const { notifyError, notifySuccess, notifyInfo } = useNotifications();
  const { completeStep } = useOnboarding();
  const [data, setData] = useState<DashboardResponse>(EMPTY_DASHBOARD);
  const [risks, setRisks] = useState<RiskAnalysis[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<MetricsImportReport | null>(null);
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const sampleCsv = [
    METRICS_CSV_HEADERS.join(","),
    "athlete_cuid_1,2026-04-05T09:00:00.000Z,10432,22,31,28,487.5,162,178,88,8.2,4,7.5,2",
    "athlete_cuid_2,2026-04-05T09:00:00.000Z,9540,18,25,21,430,154,169,76,6.9,6,6.8,4",
  ].join("\n");

  const loadDashboard = async () => {
    setIsPageLoading(true);
    setPageError(null);

    const [dashboardResult, risksResult, athletesResult] = await Promise.allSettled([
      dashboardApi.get(),
      performanceApi.listRisks(),
      athleteApi.list(),
    ]);
    const alertsData = await alertsApi.list().catch(() => []);

    if (dashboardResult.status === "fulfilled") {
      setData(dashboardResult.value);
    } else {
      setData(EMPTY_DASHBOARD);
    }

    if (risksResult.status === "fulfilled") {
      setRisks(risksResult.value);
    } else {
      setRisks([]);
    }

    if (athletesResult.status === "fulfilled") {
      setAthletes(athletesResult.value);
      setAthletesError(null);
    } else {
      setAthletes([]);
      setAthletesError(getErrorMessage(athletesResult.reason, "Nao foi possivel carregar os atletas para a importação."));
    }

    setAlerts(alertsData);

    if (dashboardResult.status === "rejected" && risksResult.status === "rejected") {
      setPageError("Nao foi possivel carregar os dados de desempenho do clube.");
    }

    setIsPageLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (data.metrics.length > 0) {
      completeStep("metrics");
    }
  }, [completeStep, data.metrics.length]);

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setImportError("Selecione um arquivo CSV antes de importar.");
      setImportReport(null);
      notifyInfo("Arquivo obrigatório", "Selecione um CSV antes de iniciar a importação.");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const report = await performanceApi.importCsv(selectedFile);
      setImportReport(report);
      notifySuccess("Importação concluída", `${report.totalImported} linhas importadas com sucesso.`);
      await loadDashboard();
    } catch (error) {
      setImportReport(null);
      const message = getErrorMessage(error, "Nao foi possivel importar o arquivo.");
      setImportError(message);
      notifyError("Falha na importação", message);
    } finally {
      setIsImporting(false);
    }
  };

  const trendData = buildTrendData(data.metrics);
  const latestMetrics = buildLatestMetrics(data.metrics);
  const topRisks = buildTopRisks(risks);
  const recentMetricsCount = buildRecentMetricsCount(data.metrics);
  const averageRiskScore = buildAverageRiskScore(risks);
  const highRiskAthletes = buildHighRiskAthletes(risks);
  const latestRisk = risks[0];
  const hasOperationalData = data.metrics.length > 0 || risks.length > 0;

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Central de Performance" subtitle="Acompanhe carga, fadiga e risco do elenco para saber onde agir primeiro em cada ciclo de treino." />
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Performance"
        subtitle="Veja rapidamente quem exige atenção, como o grupo respondeu aos últimos treinos e quais decisões precisam entrar na rotina da comissão."
        eyebrow="Performance"
      />

      <WorkflowGuide
        title="Use esta tela para abrir o dia com prioridades claras"
        description="A leitura principal já está organizada para comissão técnica, preparação física e departamento médico. Em poucos minutos você identifica riscos, tendência e atletas que pedem ajuste imediato."
        context="É o painel de acompanhamento físico do elenco, consolidando carga recente, fadiga e alertas de risco."
        action="Comece pelos alertas e métricas recentes, confirme quem está fora do padrão e use a evolução temporal para validar a decisão."
        value="Evita decisões no escuro e acelera o alinhamento entre treino, controle de minutos e prevenção."
        steps={[
          { title: "Confira os atletas em alerta", description: "Abra o ranking de maior risco para ver quem precisa de ajuste, controle ou conversa imediata." },
          { title: "Valide a tendência da semana", description: "Use a curva de evolução para entender se a carga está subindo, caindo ou acumulando fadiga." },
          { title: "Atualize a base quando necessário", description: "Se a tela estiver vazia ou desatualizada, importe um CSV para recuperar a visão operacional." },
        ]}
      />

      {pageError ? (
        <section className="page-section">
          <h2 className="text-lg font-semibold text-white">Falha ao carregar o dashboard</h2>
          <div className="mt-4">
            <FeedbackBanner tone="error" message={pageError} />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => void loadDashboard()}
          >
            Tentar novamente
          </Button>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-4 sm:p-5 lg:p-6">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(127,218,137,0.18),_transparent_62%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="min-w-0">
            <Badge tone="success">Pronto para uso</Badge>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Em poucos minutos você vê quem precisa de atenção, como a carga evoluiu e onde a comissão deve agir primeiro.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Esta tela reúne a visão diária de desempenho do clube: volume monitorado, alertas prioritários, tendência recente e uma fila clara de ação.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Atleta em foco</p>
              <p className="mt-3 text-lg font-semibold text-white">{latestRisk?.athlete.fullName ?? "Sem alertas recentes"}</p>
              <p className="mt-2 text-sm text-slate-400">
                {latestRisk ? `${latestRisk.riskLevel} com score ${Math.round(latestRisk.riskScore)}` : "Assim que houver analise, o destaque aparece aqui."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ultima coleta</p>
              <p className="mt-3 text-lg font-semibold text-white">{data.metrics[0] ? formatDateTime(latestMetrics[0].recordedAt) : "--"}</p>
              <p className="mt-2 text-sm text-slate-400">
                {latestMetrics[0] ? `${latestMetrics[0].athlete.fullName} registrou a sessao mais recente.` : "Sem metricas registradas no momento."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Leitura comercial</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {highRiskAthletes > 0 ? `${highRiskAthletes} atletas sob alerta` : "Operacao estavel"}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {hasOperationalData ? "O painel destaca primeiro o que pode impactar treino, jogo e recuperação." : "Importe dados para começar a rotina de acompanhamento."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de atletas"
          value={athletes.length}
          helper="Elenco ativo disponivel para acompanhamento."
          accentClassName="from-grass/40"
        />
        <StatCard
          label="Atletas com risco alto"
          value={highRiskAthletes}
          helper="Unicos com alerta alto nas analises recentes."
          accentClassName="from-rose-400/40"
        />
        <StatCard
          label="Metricas recentes"
          value={recentMetricsCount}
          helper="Sessoes registradas na ultima janela de 7 dias."
          accentClassName="from-sky-400/40"
        />
        <StatCard
          label="Score medio"
          value={averageRiskScore}
          helper="Media consolidada das analises de risco carregadas."
          accentClassName="from-amber-400/40"
        />
      </div>

      <Card
        title="Alertas preditivos"
        subtitle="Leitura automática de risco, sobrecarga e retorno inseguro, com explicação dos fatores usados pela IA."
        actions={<Badge tone={alerts.some((alert) => alert.severity === "HIGH") ? "danger" : "info"}>{alerts.length} alertas</Badge>}
      >
        {alerts.length === 0 ? (
          <div className="mt-2">
            {buildEmptyState(
              "Nenhum alerta preditivo no momento",
              "Assim que surgirem sinais relevantes, o painel explica por que o atleta entrou em atenção.",
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {alerts.slice(0, 6).map((alert) => (
              <article key={`${alert.code}-${alert.athleteId}-${alert.createdAt}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{alert.athleteName}</p>
                  </div>
                  <Badge tone={alert.severity === "HIGH" ? "danger" : alert.severity === "MEDIUM" ? "warning" : "info"}>{alert.severity}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-200">{alert.summary}</p>
                <div className="mt-4 rounded-2xl border border-dashed border-[#edc17a]/30 bg-[#edc17a]/6 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#edc17a]">Por que esse atleta está em risco?</p>
                  <p className="mt-2 text-sm text-slate-200">{alert.explainability.why}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">{alert.explainability.factors.join(" ")}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {!hasOperationalData && !pageError ? (
        buildEmptyState(
          "Nenhum dado de performance disponível",
          "Importe um arquivo no bloco abaixo para começar a acompanhar o elenco e liberar os alertas desta tela.",
        )
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card
          title="Evolucao temporal"
          subtitle="Veja se a semana está equilibrada ou se a resposta do grupo indica necessidade de ajuste."
          actions={<Badge>Ultimos 7 dias</Badge>}
        >
          <div className="mt-6">
            {trendData.length === 0 ? (
              buildEmptyState("Sem histórico suficiente", "Os gráficos aparecem assim que o clube registra sessões em dias diferentes.")
            ) : (
              <PerformanceChart data={trendData} />
            )}
          </div>
        </Card>

        <Card
          title="Ranking de maior risco"
          subtitle="Fila prática para saber quem deve entrar primeiro na conversa entre campo, preparação e saúde."
          actions={<Badge>Top 6</Badge>}
        >
          {topRisks.length === 0 ? (
            <div className="mt-6">{buildEmptyState("Nenhum alerta calculado", "Quando houver análise de risco, esta lista mostrará quem precisa de atenção primeiro.")}</div>
          ) : (
            <div className="mt-6 space-y-3">
              {topRisks.map((risk, index) => (
                <article key={risk.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">#{index + 1}</p>
                      <p className="mt-2 text-sm font-medium text-white">{risk.athlete.fullName}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(risk.createdAt)}</p>
                    </div>
                    <div className="sm:text-right">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getRiskBadgeClassName(risk.riskLevel)}`}>
                        {risk.riskLevel}
                      </span>
                      <p className="mt-3 text-2xl font-semibold text-white">{Math.round(risk.riskScore)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{risk.summary}</p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card
          title="Metricas recentes"
          subtitle="Últimos registros para confirmar volume, intensidade e resposta individual."
          actions={<Badge>Operacao</Badge>}
        >
          {latestMetrics.length === 0 ? (
            <div className="mt-6">{buildEmptyState("Nenhuma sessão registrada", "Importe um CSV para começar a acompanhar o elenco nesta tela.")}</div>
          ) : (
            <div className="mt-6 space-y-3">
              {latestMetrics.map((metric) => (
                <article key={metric.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{metric.athlete.fullName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{metric.athlete.position ?? "Atleta"} • {formatDateTime(metric.recordedAt)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Carga</p>
                      <p className="mt-1 text-lg font-semibold text-white">{roundMetric(metric.workload, 1) ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Fadiga</p>
                      <p className="mt-2 text-sm font-medium text-white">{roundMetric(metric.fatigueLevel, 1) ?? "-"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Minutos</p>
                      <p className="mt-2 text-sm font-medium text-white">{roundMetric(metric.sessionMinutes, 0) ?? "-"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">FC media</p>
                      <p className="mt-2 text-sm font-medium text-white">{roundMetric(metric.avgHeartRateBpm, 0) ?? "-"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Distancia</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {typeof metric.distanceMeters === "number" ? `${formatCompactNumber(metric.distanceMeters)} m` : "-"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Alertas recentes"
          subtitle="Resumo objetivo dos sinais mais recentes para apoiar decisão rápida."
          actions={<Badge>Explicavel</Badge>}
        >
          {risks.length === 0 ? (
            <div className="mt-6">{buildEmptyState("Nenhum alerta disponível", "Os próximos alertas aparecerão aqui com nível de risco, resumo e explicação.")}</div>
          ) : (
            <div className="mt-6 space-y-4">
              {risks.slice(0, 4).map((risk) => (
                <article key={risk.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{risk.athlete.fullName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        Score {Math.round(risk.riskScore)} • {formatDateTime(risk.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getRiskBadgeClassName(risk.riskLevel)}`}>
                      {risk.riskLevel}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-200">{risk.summary}</p>
                  <p className="mt-4 text-xs leading-5 text-slate-400">{risk.explanation}</p>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Atualizar dados da semana"
        subtitle="Use este bloco quando precisar atualizar ou corrigir os dados de desempenho do clube."
        actions={<Badge>CSV seguro</Badge>}
      >
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">Formato esperado</p>
              <p className="mt-2">Cabecalhos obrigatorios:</p>
              <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950/80 p-3 text-xs text-emerald-200">
                {METRICS_CSV_HEADERS.join(",")}
              </code>
              <p className="mt-3">Use `recordedAt` em ISO 8601. Campos numericos podem ficar vazios.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <p className="text-sm font-medium text-white">Exemplo</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-slate-200">{sampleCsv}</pre>
            </div>

            <form className="space-y-4" onSubmit={handleImport}>
              <label className="block space-y-2 text-sm">
                <span className="app-label">Arquivo CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </label>

              <Button type="submit" disabled={isImporting} className="w-full sm:w-auto">
                {isImporting ? "Importando..." : "Importar CSV"}
              </Button>
            </form>

            {importError ? <FeedbackBanner tone="error" message={importError} /> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">Athlete IDs ativos</p>
              {athletesError ? <div className="mt-3"><FeedbackBanner tone="error" message={athletesError} /></div> : null}
              <div className="mt-3 max-h-64 overflow-auto">
                {athletes.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">Nenhum atleta ativo disponivel.</p>
                ) : (
                  <TableWrapper>
                    <table className="app-table text-xs">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {athletes.map((athlete) => (
                        <tr key={athlete.id}>
                          <td className="text-slate-200">{athlete.fullName}</td>
                          <td className="font-mono text-slate-400">{athlete.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </TableWrapper>
                )}
              </div>
            </div>

            {importReport ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-medium text-emerald-100">Resultado da importacao</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Total lido</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{importReport.totalRead}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Importado</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{importReport.totalImported}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Com erro</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{importReport.totalWithError}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-white">Erros resumidos</p>
                  {importReport.errors.length === 0 ? (
                    <p className="mt-2 text-sm text-emerald-100">Nenhuma linha com erro.</p>
                  ) : (
                    <div className="mt-2 max-h-56 overflow-auto">
                      <TableWrapper>
                        <table className="app-table text-xs">
                        <thead className="text-emerald-100">
                          <tr>
                            <th>Linha</th>
                            <th>Athlete ID</th>
                            <th>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importReport.errors.map((errorItem, index) => (
                            <tr key={`${errorItem.row}-${index}`} className="text-slate-100">
                              <td>{errorItem.row}</td>
                              <td className="font-mono text-slate-300">{errorItem.athleteId ?? "-"}</td>
                              <td className="text-slate-200">{errorItem.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </TableWrapper>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
};
