import { squadAthletes } from "./athletesData";
import { squadAlerts } from "./alertsData";
import type { DashboardSummary } from "../types/dashboard";

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const statusCounts = {
  available: squadAthletes.filter((athlete) => athlete.status === "Disponível").length,
  preserve: squadAthletes.filter((athlete) => athlete.status === "Gerenciar carga").length,
  returning: squadAthletes.filter((athlete) => athlete.status === "Em retorno").length,
  unavailable: squadAthletes.filter((athlete) => athlete.status === "Indisponível").length,
};

const highRiskCount = squadAthletes.filter((athlete) => athlete.riskScore >= 60).length;
const criticalAlerts = squadAlerts.filter((alert) => alert.severity === "Crítico").length;

export const dashboardSummary: DashboardSummary = {
  clubName: "Atlético Aurora",
  generatedAt: "05 Abr 2026 • 08:45",
  teamStatus: `${statusCounts.available}/24 aptos`,
  periodLabel: "Últimos 7 dias",
  metrics: [
    {
      id: "monitored",
      label: "Atletas monitorados",
      value: String(squadAthletes.length),
      delta: 4.2,
      trendLabel: "base ativa",
      helper: "Todos os atletas com sinais atualizados neste microciclo.",
      icon: "Users",
      tone: "info",
    },
    {
      id: "high-risk",
      label: "Atletas de alto risco",
      value: String(highRiskCount),
      delta: 11.4,
      trendLabel: "acima da semana anterior",
      helper: "Casos com prioridade imediata para preparação física e comissão.",
      icon: "ShieldAlert",
      tone: "danger",
    },
    {
      id: "availability",
      label: "Disponibilidade do elenco",
      value: `${Math.round((statusCounts.available / squadAthletes.length) * 100)}%`,
      delta: 3.6,
      trendLabel: "estável para o jogo",
      helper: "Percentual de atletas aptos para compor a estratégia principal.",
      icon: "Activity",
      tone: "success",
    },
    {
      id: "weekly-load",
      label: "Carga média da semana",
      value: `${Math.round(average(squadAthletes.map((athlete) => athlete.workload)))} AU`,
      delta: 8.9,
      trendLabel: "acumulada vs semana anterior",
      helper: "Volume consolidado do microciclo competitivo recente.",
      icon: "Gauge",
      tone: "warning",
    },
    {
      id: "return",
      label: "Atletas em retorno",
      value: String(statusCounts.returning),
      delta: -5.2,
      trendLabel: "menos que no último bloco",
      helper: "Casos que demandam progressão controlada de minutos.",
      icon: "RotateCcw",
      tone: "info",
    },
    {
      id: "ready",
      label: "Prontos para jogar",
      value: String(squadAthletes.filter((athlete) => athlete.readinessScore >= 84).length),
      delta: 7.1,
      trendLabel: "janela favorável",
      helper: "Atletas com combinação forte de prontidão, risco e recuperação.",
      icon: "Zap",
      tone: "success",
    },
    {
      id: "critical-alerts",
      label: "Alertas críticos",
      value: String(criticalAlerts),
      delta: 16.8,
      trendLabel: "na abertura do dia",
      helper: "Alertas que podem alterar sessão, minutos ou convocação.",
      icon: "BellRing",
      tone: "danger",
    },
    {
      id: "risk-variation",
      label: "Variação semanal do risco",
      value: "+9%",
      delta: 9.0,
      trendLabel: "pressão acumulada",
      helper: "Mudança consolidada do risco médio do elenco no último recorte.",
      icon: "TrendingUp",
      tone: "warning",
    },
  ],
  loadTrend: [
    { label: "Seg", value: 338, secondaryValue: 62 },
    { label: "Ter", value: 391, secondaryValue: 66 },
    { label: "Qua", value: 446, secondaryValue: 73 },
    { label: "Qui", value: 472, secondaryValue: 78 },
    { label: "Sex", value: 428, secondaryValue: 70 },
    { label: "Sáb", value: 454, secondaryValue: 74 },
    { label: "Dom", value: 361, secondaryValue: 65 },
  ],
  squadRiskTrend: [
    { label: "Seg", value: 0.31 },
    { label: "Ter", value: 0.35 },
    { label: "Qua", value: 0.38 },
    { label: "Qui", value: 0.44 },
    { label: "Sex", value: 0.41 },
    { label: "Sáb", value: 0.46 },
    { label: "Dom", value: 0.39 },
  ],
  positionDistribution: [
    { label: "Goleiros", value: 2 },
    { label: "Defensores", value: 7 },
    { label: "Meio-campo", value: 8 },
    { label: "Ataque", value: 7 },
  ],
  topRiskAthletes: squadAthletes
    .slice()
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 5)
    .map((athlete) => ({ athleteId: athlete.id, name: athlete.name, riskScore: athlete.riskScore })),
  topReadinessAthletes: squadAthletes
    .slice()
    .sort((left, right) => right.readinessScore - left.readinessScore)
    .slice(0, 5)
    .map((athlete) => ({ athleteId: athlete.id, name: athlete.name, readinessScore: athlete.readinessScore })),
  alertSeverity: [
    { label: "Crítico", value: squadAlerts.filter((alert) => alert.severity === "Crítico").length },
    { label: "Alto", value: squadAlerts.filter((alert) => alert.severity === "Alto").length },
    { label: "Moderado", value: squadAlerts.filter((alert) => alert.severity === "Moderado").length },
  ],
  recentInsights: [
    {
      id: "ins-1",
      title: "A carga acumulada aumentou 12% em relação à semana anterior.",
      description: "O avanço veio principalmente do corredor direito e dos extremos com estímulos máximos repetidos.",
      tone: "warning",
    },
    {
      id: "ins-2",
      title: "3 atletas entraram em zona de atenção por piora na recuperação.",
      description: "Os casos concentram-se em quem respondeu pior após o bloco forte de quinta e sábado.",
      tone: "danger",
    },
    {
      id: "ins-3",
      title: "O setor ofensivo apresenta boa prontidão para alta intensidade.",
      description: "Dois atacantes de lado e o centroavante titular chegam com condição física favorável.",
      tone: "success",
    },
  ],
  strategicSummary: [
    "A janela competitiva é favorável para iniciar com bloco ofensivo agressivo, desde que o corredor direito tenha controle de exposição.",
    "Os atletas em retorno estão aptos para participação, mas ainda não para carga total.",
    "Os alertas críticos têm impacto direto em escolhas de minutos e construção do banco.",
  ],
  watchlist: squadAthletes
    .filter((athlete) => athlete.status === "Gerenciar carga")
    .slice(0, 4)
    .map((athlete) => athlete.name),
  unavailable: squadAthletes
    .filter((athlete) => athlete.status === "Indisponível")
    .map((athlete) => athlete.name),
  mostReady: squadAthletes
    .slice()
    .sort((left, right) => right.readinessScore - left.readinessScore)
    .slice(0, 4)
    .map((athlete) => athlete.name),
  readiness: {
    fitCount: statusCounts.available,
    preserveCount: statusCounts.preserve,
    returnCount: statusCounts.returning,
    recommendation:
      "Base competitiva forte para o próximo jogo, com necessidade de modular o corredor direito e os extremos de maior carga.",
  },
};
