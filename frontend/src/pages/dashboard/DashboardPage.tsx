import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { athleteApi } from "../../api/athletes";
import { dashboardApi } from "../../api/dashboard";
import { performanceApi } from "../../api/performance";
import { PerformanceChart } from "../../components/charts/PerformanceChart";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { Select } from "../../components/common/Select";
import { StatCard } from "../../components/common/StatCard";
import { TableWrapper } from "../../components/common/TableWrapper";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useNotifications } from "../../hooks/useNotifications";
import type { Athlete } from "../../types/athlete";
import type { DashboardMetricPoint } from "../../types/dashboard";
import { METRICS_CSV_HEADERS, type CsvPreviewResult, type MetricsImportReport, type PerformanceFormValues, type PerformanceRecord, type RiskAnalysis } from "../../types/performance";
import {
  EMPTY_PERFORMANCE_FORM_VALUES,
  buildDashboardMetrics,
  buildRiskAnalyses,
  buildTrendData,
  convertLegacyMetricToRecord,
  dedupePerformanceRecords,
  parseManualPerformanceForm,
  parsePerformanceCsv,
} from "../../utils/performance";

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

const formatDateTimeLocalInput = (value: string) => {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

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

const buildHighRiskAthletes = (risks: RiskAnalysis[]) =>
  new Set(risks.filter((risk) => risk.riskLevel === "HIGH").map((risk) => risk.athleteId)).size;

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

const sampleCsv = [
  METRICS_CSV_HEADERS.join(","),
  "athlete_cuid_1,2026-04-05T09:00:00.000Z,10432,22,31,28,487.5,162,178,88,8.2,4,7.5,2",
  "athlete_cuid_2,2026-04-05T09:00:00.000Z,9540,18,25,21,430,154,169,76,6.9,6,6.8,4",
].join("\n");

export const DashboardPage = () => {
  const { notifyError, notifyInfo, notifySuccess } = useNotifications();
  const { completeStep } = useOnboarding();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedMode, setSelectedMode] = useState<"manual" | "csv">("manual");
  const [manualValues, setManualValues] = useState<PerformanceFormValues>({
    ...EMPTY_PERFORMANCE_FORM_VALUES,
    recordedAt: formatDateTimeLocalInput(new Date().toISOString()),
  });
  const [manualErrors, setManualErrors] = useState<Partial<Record<keyof PerformanceFormValues, string>>>({});
  const [manualFeedback, setManualFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResult | null>(null);
  const [importReport, setImportReport] = useState<MetricsImportReport | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [athletesError, setAthletesError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsPageLoading(true);
    setPageError(null);

    const [athletesResult, recordsResult, legacyDashboardResult] = await Promise.allSettled([
      athleteApi.list(),
      performanceApi.list(),
      dashboardApi.get(),
    ]);

    const loadedAthletes = athletesResult.status === "fulfilled" ? athletesResult.value : [];
    const localRecords = performanceApi.listLocal();
    const apiRecords =
      recordsResult.status === "fulfilled"
        ? recordsResult.value.map((record) => ({ ...record, source: "api" as const }))
        : [];
    const legacyRecords =
      recordsResult.status === "rejected" && legacyDashboardResult.status === "fulfilled"
        ? legacyDashboardResult.value.metrics.map(convertLegacyMetricToRecord)
        : [];

    setRecords(dedupePerformanceRecords([...apiRecords, ...legacyRecords, ...localRecords]));

    if (athletesResult.status === "fulfilled") {
      setAthletes(loadedAthletes);
      setAthletesError(null);
    } else {
      setAthletes([]);
      setAthletesError(getErrorMessage(athletesResult.reason, "Nao foi possivel carregar os atletas ativos."));
    }

    if (recordsResult.status === "rejected" && legacyDashboardResult.status === "rejected") {
      setPageError("Nao foi possivel carregar os dados de performance do clube.");
    }

    setIsPageLoading(false);
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const dashboardMetrics = buildDashboardMetrics(records, athletes);
  const risks = buildRiskAnalyses(records, athletes);

  useEffect(() => {
    if (dashboardMetrics.length > 0) {
      completeStep("metrics");
    }
  }, [completeStep, dashboardMetrics.length]);

  const trendData = buildTrendData(records);
  const latestMetrics = buildLatestMetrics(dashboardMetrics);
  const topRisks = buildTopRisks(risks);
  const recentMetricsCount = buildRecentMetricsCount(dashboardMetrics);
  const averageRiskScore = buildAverageRiskScore(risks);
  const highRiskAthletes = buildHighRiskAthletes(risks);
  const latestRisk = risks[0];
  const totalAthletes = athletes.length > 0 ? athletes.length : new Set(records.map((record) => record.athleteId)).size;
  const hasOperationalData = dashboardMetrics.length > 0 || risks.length > 0;

  const updateManualField = (field: keyof PerformanceFormValues, value: string) => {
    setManualValues((current) => ({ ...current, [field]: value }));

    if (manualErrors[field]) {
      setManualErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualFeedback(null);

    const parsed = parseManualPerformanceForm(manualValues);
    const nextErrors = parsed.fieldErrors ?? {};

    if (manualValues.athleteId && athletes.length > 0 && !athletes.some((athlete) => athlete.id === manualValues.athleteId)) {
      nextErrors.athleteId = "Selecione um atleta válido da base.";
    }

    if (Object.keys(nextErrors).length > 0 || !parsed.payload) {
      setManualErrors(nextErrors);
      setManualFeedback({ tone: "error", message: "Revise os campos obrigatórios e os valores numéricos antes de salvar." });
      notifyError("Cadastro manual inválido", "Há campos com erro no formulário.");
      return;
    }

    setIsSavingManual(true);

    try {
      await performanceApi.createManual(parsed.payload);
      setManualErrors({});
      setManualValues({
        ...EMPTY_PERFORMANCE_FORM_VALUES,
        recordedAt: formatDateTimeLocalInput(new Date().toISOString()),
      });
      setManualFeedback({ tone: "success", message: "Registro manual salvo. O dashboard já foi recalculado." });
      notifySuccess("Performance atualizada", "O registro manual foi salvo com sucesso.");
      await loadDashboard();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel salvar o registro manual.");
      setManualFeedback({ tone: "error", message });
      notifyError("Falha ao salvar", message);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handlePreparePreview = async () => {
    if (!selectedFile) {
      setImportFeedback({ tone: "error", message: "Selecione um arquivo CSV antes de gerar a prévia." });
      setCsvPreview(null);
      setImportReport(null);
      notifyInfo("Arquivo obrigatório", "Selecione um CSV para analisar antes de importar.");
      return;
    }

    setIsPreparingPreview(true);
    setImportFeedback(null);
    setImportReport(null);

    try {
      const fileText = await selectedFile.text();
      const preview = parsePerformanceCsv(fileText, athletes);

      setCsvPreview(preview);

      if (preview.validRows.length === 0) {
        setImportFeedback({ tone: "error", message: "Nenhum registro válido foi encontrado na prévia." });
        notifyError("Prévia inválida", "O arquivo não contém linhas válidas para importação.");
        return;
      }

      setImportFeedback({
        tone: "info",
        message: `${preview.validRows.length} registros válidos e ${preview.invalidRows.length} inválidos prontos para revisão.`,
      });
      notifySuccess("Prévia gerada", "Revise os registros e confirme a importação.");
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel ler o arquivo CSV.");
      setImportFeedback({ tone: "error", message });
      setCsvPreview(null);
      notifyError("Falha ao preparar prévia", message);
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !csvPreview) {
      setImportFeedback({ tone: "error", message: "Gere a prévia do CSV antes de confirmar a importação." });
      return;
    }

    if (csvPreview.validRows.length === 0) {
      setImportFeedback({ tone: "error", message: "A prévia não possui linhas válidas para importar." });
      return;
    }

    setIsImporting(true);

    try {
      const report = await performanceApi.importCsv(selectedFile, csvPreview);
      setImportReport(report);
      setCsvPreview(null);
      setSelectedFile(null);
      setImportFeedback({
        tone: "success",
        message: `${report.totalImported} registros importados. Dashboard e alertas foram recalculados.`,
      });
      notifySuccess("Importação concluída", `${report.totalImported} linhas importadas com sucesso.`);
      await loadDashboard();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel importar o arquivo.");
      setImportFeedback({ tone: "error", message });
      notifyError("Falha na importação", message);
    } finally {
      setIsImporting(false);
    }
  };

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
          { title: "Atualize a base quando necessário", description: "Use o cadastro manual ou a importação CSV para manter a operação atualizada sem depender de dados estáticos." },
        ]}
      />

      {pageError ? (
        <section className="page-section">
          <h2 className="text-lg font-semibold text-white">Falha ao carregar o dashboard</h2>
          <div className="mt-4">
            <FeedbackBanner tone="error" message={pageError} />
          </div>
          <Button type="button" variant="secondary" className="mt-4" onClick={() => void loadDashboard()}>
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
                {latestRisk ? `${latestRisk.riskLevel} com score ${Math.round(latestRisk.riskScore)}` : "Assim que houver análise, o destaque aparece aqui."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Última coleta</p>
              <p className="mt-3 text-lg font-semibold text-white">{latestMetrics[0] ? formatDateTime(latestMetrics[0].recordedAt) : "--"}</p>
              <p className="mt-2 text-sm text-slate-400">
                {latestMetrics[0] ? `${latestMetrics[0].athlete.fullName} registrou a sessão mais recente.` : "Sem métricas registradas no momento."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Leitura comercial</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {highRiskAthletes > 0 ? `${highRiskAthletes} atletas sob alerta` : "Operação estável"}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {hasOperationalData ? "O painel destaca primeiro o que pode impactar treino, jogo e recuperação." : "Cadastre dados manualmente ou importe um CSV para iniciar a rotina."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de atletas"
          value={totalAthletes}
          helper="Elenco ativo disponível para acompanhamento."
          accentClassName="from-grass/40"
        />
        <StatCard
          label="Atletas com risco alto"
          value={highRiskAthletes}
          helper="Únicos com alerta alto nas análises recentes."
          accentClassName="from-rose-400/40"
        />
        <StatCard
          label="Métricas recentes"
          value={recentMetricsCount}
          helper="Sessões registradas na última janela de 7 dias."
          accentClassName="from-sky-400/40"
        />
        <StatCard
          label="Score médio"
          value={averageRiskScore}
          helper="Média consolidada das análises de risco carregadas."
          accentClassName="from-amber-400/40"
        />
      </div>

      {!hasOperationalData && !pageError ? (
        buildEmptyState(
          "Nenhum dado de performance disponível",
          "Use o bloco de atualização abaixo para cadastrar uma coleta manualmente ou importar um CSV e liberar os alertas da página.",
        )
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card
          title="Evolução temporal"
          subtitle="Veja se a semana está equilibrada ou se a resposta do grupo indica necessidade de ajuste."
          actions={<Badge>Últimos 7 dias</Badge>}
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
          title="Métricas recentes"
          subtitle="Últimos registros para confirmar volume, intensidade e resposta individual."
          actions={<Badge>Operação</Badge>}
        >
          {latestMetrics.length === 0 ? (
            <div className="mt-6">{buildEmptyState("Nenhuma sessão registrada", "Cadastre uma coleta ou importe um CSV para começar o acompanhamento.")}</div>
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
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">FC média</p>
                      <p className="mt-2 text-sm font-medium text-white">{roundMetric(metric.avgHeartRateBpm, 0) ?? "-"}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Distância</p>
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
          actions={<Badge>Explicável</Badge>}
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
        subtitle="Use este bloco para manter a operação viva, registrando coletas manualmente ou importando lotes via CSV."
        actions={<Badge>Operacional</Badge>}
      >
        <div className="mt-5 space-y-5">
          <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/80 p-1">
            <button
              type="button"
              onClick={() => setSelectedMode("manual")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${selectedMode === "manual" ? "bg-emerald-400/15 text-emerald-100" : "text-slate-400 hover:text-white"}`}
            >
              Adicionar manualmente
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("csv")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${selectedMode === "csv" ? "bg-emerald-400/15 text-emerald-100" : "text-slate-400 hover:text-white"}`}
            >
              Importar CSV
            </button>
          </div>

          {selectedMode === "manual" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <form className="space-y-4" onSubmit={handleManualSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    id="athleteId"
                    label="Atleta"
                    value={manualValues.athleteId}
                    onChange={(event) => updateManualField("athleteId", event.target.value)}
                    error={manualErrors.athleteId}
                    disabled={athletes.length === 0}
                  >
                    <option value="">Selecione</option>
                    {athletes.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.fullName}
                      </option>
                    ))}
                  </Select>
                  <Input
                    id="recordedAt"
                    type="datetime-local"
                    label="Data/hora da coleta"
                    value={manualValues.recordedAt}
                    onChange={(event) => updateManualField("recordedAt", event.target.value)}
                    error={manualErrors.recordedAt}
                  />
                  <Input id="distanceMeters" type="number" label="Distância em metros" value={manualValues.distanceMeters} onChange={(event) => updateManualField("distanceMeters", event.target.value)} error={manualErrors.distanceMeters} />
                  <Input id="sprintCount" type="number" label="Sprints" value={manualValues.sprintCount} onChange={(event) => updateManualField("sprintCount", event.target.value)} error={manualErrors.sprintCount} />
                  <Input id="accelCount" type="number" label="Acelerações" value={manualValues.accelCount} onChange={(event) => updateManualField("accelCount", event.target.value)} error={manualErrors.accelCount} />
                  <Input id="decelCount" type="number" label="Desacelerações" value={manualValues.decelCount} onChange={(event) => updateManualField("decelCount", event.target.value)} error={manualErrors.decelCount} />
                  <Input id="workload" type="number" step="0.1" label="Carga de treino" value={manualValues.workload} onChange={(event) => updateManualField("workload", event.target.value)} error={manualErrors.workload} />
                  <Input id="avgHeartRateBpm" type="number" label="Frequência cardíaca média" value={manualValues.avgHeartRateBpm} onChange={(event) => updateManualField("avgHeartRateBpm", event.target.value)} error={manualErrors.avgHeartRateBpm} />
                  <Input id="maxHeartRateBpm" type="number" label="Frequência cardíaca máxima" value={manualValues.maxHeartRateBpm} onChange={(event) => updateManualField("maxHeartRateBpm", event.target.value)} error={manualErrors.maxHeartRateBpm} />
                  <Input id="sessionMinutes" type="number" label="Minutos da sessão" value={manualValues.sessionMinutes} onChange={(event) => updateManualField("sessionMinutes", event.target.value)} error={manualErrors.sessionMinutes} />
                  <Input id="perceivedEffort" type="number" step="0.1" label="Esforço percebido" value={manualValues.perceivedEffort} onChange={(event) => updateManualField("perceivedEffort", event.target.value)} error={manualErrors.perceivedEffort} />
                  <Input id="fatigueLevel" type="number" step="0.1" label="Nível de fadiga" value={manualValues.fatigueLevel} onChange={(event) => updateManualField("fatigueLevel", event.target.value)} error={manualErrors.fatigueLevel} />
                  <Input id="sleepHours" type="number" step="0.1" label="Horas de sono" value={manualValues.sleepHours} onChange={(event) => updateManualField("sleepHours", event.target.value)} error={manualErrors.sleepHours} />
                  <Input id="sorenessLevel" type="number" step="0.1" label="Nível de dor muscular" value={manualValues.sorenessLevel} onChange={(event) => updateManualField("sorenessLevel", event.target.value)} error={manualErrors.sorenessLevel} />
                </div>

                {manualFeedback ? <FeedbackBanner tone={manualFeedback.tone} message={manualFeedback.message} /> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" disabled={isSavingManual || athletes.length === 0}>
                    {isSavingManual ? "Salvando..." : "Salvar registro"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setManualValues({
                        ...EMPTY_PERFORMANCE_FORM_VALUES,
                        recordedAt: formatDateTimeLocalInput(new Date().toISOString()),
                      });
                      setManualErrors({});
                      setManualFeedback(null);
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </form>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">Leitura operacional</p>
                  <p className="mt-2 leading-7">
                    Use este formulário para registrar uma coleta pontual sem depender de planilhas. Campos numéricos podem ficar vazios quando a coleta não trouxer a métrica.
                  </p>
                </div>

                {athletesError ? <FeedbackBanner tone="error" message={athletesError} /> : null}

                {athletes.length === 0 ? (
                  <EmptyState
                    title="Nenhum atleta ativo disponível"
                    description="Cadastre atletas ativos para liberar o lançamento manual e manter a base consistente."
                  />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-sm font-medium text-white">Atletas disponíveis</p>
                    <div className="mt-3 max-h-80 overflow-auto">
                      <TableWrapper>
                        <table className="app-table text-xs">
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Posição</th>
                              <th>ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {athletes.map((athlete) => (
                              <tr key={athlete.id}>
                                <td className="text-slate-200">{athlete.fullName}</td>
                                <td>{athlete.position}</td>
                                <td className="font-mono text-slate-400">{athlete.id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableWrapper>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">Formato esperado</p>
                  <p className="mt-2">Cabeçalhos obrigatórios:</p>
                  <code className="mt-3 block overflow-x-auto rounded-xl bg-slate-950/80 p-3 text-xs text-emerald-200">
                    {METRICS_CSV_HEADERS.join(",")}
                  </code>
                  <p className="mt-3">Use `recordedAt` em ISO 8601. Linhas vazias são ignoradas e campos numéricos podem ficar vazios.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-sm font-medium text-white">Exemplo</p>
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-slate-200">{sampleCsv}</pre>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <label className="block space-y-2 text-sm">
                    <span className="app-label">Arquivo CSV</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(event) => {
                        setSelectedFile(event.target.files?.[0] ?? null);
                        setCsvPreview(null);
                        setImportReport(null);
                        setImportFeedback(null);
                      }}
                      className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-pitch file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                  </label>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={() => void handlePreparePreview()} disabled={isPreparingPreview || athletes.length === 0}>
                      {isPreparingPreview ? "Gerando prévia..." : "Gerar prévia"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => void handleConfirmImport()} disabled={isImporting || !csvPreview || csvPreview.validRows.length === 0}>
                      {isImporting ? "Importando..." : "Confirmar importação"}
                    </Button>
                  </div>
                </div>

                {importFeedback ? <FeedbackBanner tone={importFeedback.tone} message={importFeedback.message} /> : null}

                {csvPreview ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Prévia antes da confirmação</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {csvPreview.validRows.length} válidos, {csvPreview.invalidRows.length} inválidos, {csvPreview.totalRead} linhas lidas.
                        </p>
                      </div>
                      <Badge>{selectedFile?.name ?? "CSV"}</Badge>
                    </div>

                    {csvPreview.validRows.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-white">Registros válidos</p>
                        <div className="mt-3 max-h-72 overflow-auto">
                          <TableWrapper>
                            <table className="app-table text-xs">
                              <thead>
                                <tr>
                                  <th>Linha</th>
                                  <th>Atleta</th>
                                  <th>Data</th>
                                  <th>Carga</th>
                                  <th>Fadiga</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreview.validRows.map((row) => (
                                  <tr key={`valid-${row.row}`}>
                                    <td>{row.row}</td>
                                    <td className="text-slate-200">{row.athleteName ?? row.athleteId}</td>
                                    <td>{row.record ? formatDateTime(row.record.recordedAt) : "-"}</td>
                                    <td>{row.record?.workload ?? "-"}</td>
                                    <td>{row.record?.fatigueLevel ?? "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </TableWrapper>
                        </div>
                      </div>
                    ) : null}

                    {csvPreview.invalidRows.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-white">Linhas com erro</p>
                        <div className="mt-3 max-h-72 overflow-auto">
                          <TableWrapper>
                            <table className="app-table text-xs">
                              <thead>
                                <tr>
                                  <th>Linha</th>
                                  <th>Athlete ID</th>
                                  <th>Erros</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreview.invalidRows.map((row) => (
                                  <tr key={`invalid-${row.row}`}>
                                    <td>{row.row}</td>
                                    <td className="font-mono text-slate-300">{row.athleteId || "-"}</td>
                                    <td className="text-slate-200">{row.errors.join(" ")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </TableWrapper>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">Athlete IDs ativos</p>
                  {athletesError ? <div className="mt-3"><FeedbackBanner tone="error" message={athletesError} /></div> : null}
                  <div className="mt-3 max-h-72 overflow-auto">
                    {athletes.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400">Nenhum atleta ativo disponível.</p>
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
                    <p className="text-sm font-medium text-emerald-100">Resultado da importação</p>
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
          )}
        </div>
      </Card>
    </div>
  );
};
