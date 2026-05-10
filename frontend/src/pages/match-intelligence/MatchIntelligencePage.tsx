import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { matchIntelligenceApi } from "../../api/matchIntelligence";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { ProbabilityBar } from "../../components/common/ProbabilityBar";
import { Select } from "../../components/common/Select";
import { StatCard } from "../../components/common/StatCard";
import { TeamStrengthComparison } from "../../components/common/TeamStrengthComparison";
import { Textarea } from "../../components/common/Textarea";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  LineupSuggestionResponse,
  MatchIntelligenceMatchItem,
  MatchPrediction,
  MatchPredictionFactor,
} from "../../types/matchIntelligence";

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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const impactTone = {
  positive: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  negative: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  neutral: "border-white/10 bg-white/5 text-slate-100",
} as const;

const impactLabel = {
  positive: "Ponto a favor",
  negative: "Ponto de atenção",
  neutral: "Ponto de equilíbrio",
} as const;

const buildEmptyState = (title: string, description: string) => <EmptyState title={title} description={description} />;

const MatchIntelligenceSkeleton = () => (
  <div className="space-y-6">
    <LoadingState lines={4} cardHeight="h-32" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" />
    <div className="app-loading-block h-[34rem]" />
  </div>
);

export const MatchIntelligencePage = () => {
  const { notifyError, notifySuccess } = useNotifications();
  const { completeStep } = useOnboarding();
  const [matches, setMatches] = useState<MatchIntelligenceMatchItem[]>([]);
  const [predictionsByMatch, setPredictionsByMatch] = useState<Record<string, MatchPrediction[]>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [opponentStrengthDraft, setOpponentStrengthDraft] = useState("55");
  const [venueContext, setVenueContext] = useState<"HOME" | "AWAY" | "NEUTRAL">("HOME");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningPredictionMatchId, setRunningPredictionMatchId] = useState<string | null>(null);
  const [lineupSuggestion, setLineupSuggestion] = useState<LineupSuggestionResponse | null>(null);
  const [isLineupLoading, setIsLineupLoading] = useState(false);
  const [formationDraft, setFormationDraft] = useState("4-3-3");
  const [opponentContextDraft, setOpponentContextDraft] = useState("");

  const loadPage = async () => {
    setLoading(true);
    setError(null);

    try {
      const matchesData = await matchIntelligenceApi.listMatches();
      const predictionEntries = await Promise.all(
        matchesData.map(async (match) => [match.id, await matchIntelligenceApi.listPredictions(match.id)] as const),
      );

      setMatches(matchesData);
      setPredictionsByMatch(Object.fromEntries(predictionEntries));

      if (matchesData.length > 0) {
        const nextSelected = matchesData.some((match) => match.id === selectedMatchId) ? selectedMatchId : matchesData[0].id;
        setSelectedMatchId(nextSelected);
      } else {
        setSelectedMatchId("");
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nao foi possivel carregar Match Intelligence."));
      setMatches([]);
      setPredictionsByMatch({});
      setSelectedMatchId("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      completeStep("intelligence");
    }
  }, [completeStep, error, loading]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? matches[0] ?? null,
    [matches, selectedMatchId],
  );

  const selectedPrediction = selectedMatch ? predictionsByMatch[selectedMatch.id]?.[0] ?? null : null;
  const selectedPredictionHistory = selectedMatch ? predictionsByMatch[selectedMatch.id] ?? [] : [];

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    const suggestedStrength =
      selectedPrediction?.payloadJson?.opponentStrengthScore ??
      selectedMatch.intelligenceReports[0]?.opponentStrengthScore ??
      55;

    setOpponentStrengthDraft(String(Math.round(suggestedStrength)));
  }, [selectedMatch, selectedPrediction]);

  const executiveSummary = useMemo(() => {
    const predictions = Object.values(predictionsByMatch).flat();

    if (predictions.length === 0) {
      return {
        averageConfidence: 0,
        favorableMatches: 0,
        averageHomeWin: 0,
        publicReadyMatches: 0,
      };
    }

    return {
      averageConfidence:
        predictions.reduce((sum, prediction) => sum + prediction.confidenceScore, 0) / predictions.length,
      favorableMatches: predictions.filter((prediction) => prediction.favoriteTeam !== "DRAW").length,
      averageHomeWin:
        predictions.reduce((sum, prediction) => sum + prediction.homeWinProbability, 0) / predictions.length,
      publicReadyMatches: predictions.filter((prediction) => prediction.payloadJson?.publicContextId).length,
    };
  }, [predictionsByMatch]);

  const handlePredict = async () => {
    if (!selectedMatch) {
      return;
    }

    const parsedStrength = Number(opponentStrengthDraft.trim());

    setRunningPredictionMatchId(selectedMatch.id);
    setError(null);

    try {
      const prediction = await matchIntelligenceApi.predictMatch(selectedMatch.id, {
        opponentStrengthOverride: Number.isFinite(parsedStrength) ? parsedStrength : undefined,
        venueContext,
      });

      setPredictionsByMatch((current) => ({
        ...current,
        [selectedMatch.id]: [prediction, ...(current[selectedMatch.id] ?? [])],
      }));
      notifySuccess("Previsão gerada", "A leitura da partida foi salva com sucesso.");
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Nao foi possivel gerar a previsao desta partida.");
      setError(message);
      notifyError("Falha ao gerar previsão", message);
    } finally {
      setRunningPredictionMatchId(null);
    }
  };

  const handleSuggestLineup = async () => {
    setIsLineupLoading(true);

    try {
      const parsedStrength = Number(opponentStrengthDraft.trim());
      const result = await matchIntelligenceApi.suggestLineup({
        matchId: selectedMatch?.id,
        formation: formationDraft,
        opponentContext: opponentContextDraft.trim() || undefined,
        opponentStrengthOverride: Number.isFinite(parsedStrength) ? parsedStrength : undefined,
      });
      setLineupSuggestion(result);
      notifySuccess("Escalação sugerida", "A IA retornou lineup, alternativas e justificativa.");
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Nao foi possivel sugerir a escalação para este contexto.");
      notifyError("Falha na escalação inteligente", message);
    } finally {
      setIsLineupLoading(false);
    }
  };

  const keyFactors = (selectedPrediction?.keyFactorsJson ?? []) as MatchPredictionFactor[];
  const teamLabel = venueContext === "AWAY" ? "Seu time" : "Seu time";
  const opponentLabel = selectedMatch?.opponent ?? "Adversário";
  const leftTeamLabel = venueContext === "AWAY" ? opponentLabel : teamLabel;
  const rightTeamLabel = venueContext === "AWAY" ? teamLabel : opponentLabel;

  const favoriteSummary = !selectedPrediction
    ? null
    : selectedPrediction.favoriteTeam === "DRAW"
      ? {
          title: "Confronto equilibrado",
          helper: "A leitura aponta jogo aberto, sem vantagem clara neste momento.",
          tone: "warning" as const,
        }
      : {
          title: selectedPrediction.favoriteTeam === "HOME" ? leftTeamLabel : rightTeamLabel,
          helper:
            selectedPrediction.favoriteTeam === "HOME"
              ? "É o lado com maior chance de controlar o cenário atual."
              : "É o lado que chega com vantagem no cenário atual.",
          tone: "success" as const,
        };

  const quickSummaryItems = [
    selectedPrediction?.payloadJson?.aggregatedRisk && selectedPrediction.payloadJson.aggregatedRisk >= 45
      ? "O grupo chega com risco físico acima do ideal."
      : null,
    selectedPrediction?.payloadJson?.aggregatedFatigue && selectedPrediction.payloadJson.aggregatedFatigue >= 5
      ? "Há sinal de desgaste que merece ajuste na preparação."
      : null,
    selectedPrediction?.payloadJson?.publicContextId
      ? "A leitura foi reforçada com contexto recente do adversário."
      : "A leitura foi construída principalmente com dados internos do clube.",
    selectedPrediction
      ? `A confiança desta previsão está em ${selectedPrediction.confidenceScore.toFixed(1)} de 100.`
      : null,
  ].filter(Boolean) as string[];

  const alertItems = [
    selectedPrediction?.payloadJson?.aggregatedRisk && selectedPrediction.payloadJson.aggregatedRisk >= 45
      ? `Atenção ao risco físico do grupo: ${selectedPrediction.payloadJson.aggregatedRisk.toFixed(1)}.`
      : null,
    selectedPrediction?.payloadJson?.aggregatedFatigue && selectedPrediction.payloadJson.aggregatedFatigue >= 5
      ? `Fadiga acima do ideal: ${selectedPrediction.payloadJson.aggregatedFatigue.toFixed(1)}.`
      : null,
    selectedPrediction?.payloadJson?.publicContextId
      ? "Leitura reforçada com contexto recente do adversário."
      : "Leitura baseada principalmente em dados internos do clube.",
    selectedPrediction ? `Confiança atual da previsão: ${selectedPrediction.confidenceScore.toFixed(1)}.` : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <PageHeader
        title="Match Intelligence"
        subtitle="Compare cenários de jogo, gere previsões e apoie a preparação da partida com uma leitura simples e explicável."
        eyebrow="Jogo"
      />

      <WorkflowGuide
        title="Use esta tela para transformar contexto de jogo em decisão"
        description="O objetivo aqui não é mostrar números soltos, e sim ajudar a comissão a entender o cenário da partida, o peso do adversário e os principais fatores por trás da previsão."
        context="É a área onde você compara os times, vê as chances do jogo e entende os principais sinais do confronto."
        action="Selecione uma partida, ajuste o contexto se necessário e gere uma nova previsão para revisar o cenário atual."
        value="Ajuda a preparar estratégia, comunicação interna e revisão pré-jogo com uma leitura objetiva."
        steps={[
          { title: "Escolha a partida certa", description: "Use a coluna lateral para abrir o confronto que será analisado pela comissão." },
          { title: "Ajuste força do adversário e mando", description: "Refine o contexto do jogo antes de gerar a leitura mais atual." },
          { title: "Use fatores e alertas na preparação", description: "Depois da previsão, concentre a conversa nos pontos que mais influenciam o cenário." },
        ]}
      />

      {loading ? (
        <MatchIntelligenceSkeleton />
      ) : (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Confianca media"
              value={executiveSummary.averageConfidence.toFixed(1)}
              helper="Média das leituras já geradas para o clube."
              accentClassName="from-sky-400/30"
            />
            <StatCard
              label="Leituras geradas"
              value={Object.values(predictionsByMatch).flat().length}
              helper="Histórico salvo para comparar cenários."
              accentClassName="from-grass/30"
            />
            <StatCard
              label="Vitória média do clube"
              value={`${executiveSummary.averageHomeWin.toFixed(1)}%`}
              helper="Chance media de vitoria nas ultimas simulacoes."
              accentClassName="from-amber-300/30"
            />
            <StatCard
              label="Com contexto extra"
              value={executiveSummary.publicReadyMatches}
              helper="Leituras reforçadas com informações adicionais."
              accentClassName="from-rose-400/30"
            />
          </section>

          <Card
            title="Escalação inteligente"
            subtitle="Sugestão de lineup baseada em disponibilidade, fadiga, risco recente e contexto competitivo."
            actions={<Badge tone="info">AI Explainability</Badge>}
          >
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <Input label="Formação" value={formationDraft} onChange={(event) => setFormationDraft(event.target.value)} placeholder="Ex.: 4-3-3" />
                <Textarea
                  label="Contexto do adversário"
                  value={opponentContextDraft}
                  onChange={(event) => setOpponentContextDraft(event.target.value)}
                  placeholder="Ex.: adversário pressiona alto, usa muito corredor esquerdo, baixa linha após vantagem."
                />
                <Button type="button" onClick={() => void handleSuggestLineup()} disabled={isLineupLoading}>
                  {isLineupLoading ? "Gerando escalação..." : "Sugerir escalação"}
                </Button>
              </div>

              <div className="space-y-4">
                {!lineupSuggestion ? (
                  buildEmptyState("Nenhuma escalação sugerida ainda", "Gere uma leitura para receber o melhor lineup, alternativas e explicação da IA.")
                ) : (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-label-muted">Resumo</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">{lineupSuggestion.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-[#edc17a]/30 bg-[#edc17a]/6 p-4">
                      <p className="text-sm font-medium text-white">Por que essa escalação foi sugerida?</p>
                      <p className="mt-2 text-sm leading-7 text-slate-200">{lineupSuggestion.explanation}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-300">{lineupSuggestion.explainability.factors.join(" ")}</p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-white">Lineup principal</p>
                        <div className="mt-3 space-y-3">
                          {lineupSuggestion.lineup.map((athlete, index) => (
                            <div key={athlete.athleteId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <p className="text-sm font-medium text-white">#{index + 1} {athlete.fullName}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {athlete.position} • prontidão {athlete.readinessScore} • risco {athlete.riskLevel}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-white">Alternativas</p>
                        <div className="mt-3 space-y-3">
                          {lineupSuggestion.alternatives.map((athlete) => (
                            <div key={athlete.athleteId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <p className="text-sm font-medium text-white">{athlete.fullName}</p>
                              <p className="mt-1 text-xs text-slate-400">{athlete.position} • prontidão {athlete.readinessScore}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {error ? (
            <div className="mb-6">
              <FeedbackBanner tone="error" message={error} />
            </div>
          ) : null}

          {matches.length === 0 ? (
            buildEmptyState(
              "Nenhuma partida pronta para análise",
              "Cadastre partidas e gere a primeira previsão para começar a usar esta área.",
            )
          ) : (
            <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
              <aside className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 xl:sticky xl:top-28 xl:h-fit">
                <p className="px-2 text-xs uppercase tracking-[0.24em] text-slate-400">Partidas</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {matches.map((match) => {
                    const latestPrediction = predictionsByMatch[match.id]?.[0] ?? null;
                    const isActive = selectedMatch?.id === match.id;

                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => setSelectedMatchId(match.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isActive ? "border-grass/40 bg-grass/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{match.competition ?? "Partida"}</p>
                        <p className="mt-2 text-base font-semibold text-white">{match.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{match.opponent}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDate(match.matchDate)}</p>
                        <p className="mt-3 text-xs text-slate-400">
                          {latestPrediction
                            ? `Última leitura: ${latestPrediction.homeWinProbability.toFixed(1)}% / ${latestPrediction.drawProbability.toFixed(1)}% / ${latestPrediction.awayWinProbability.toFixed(1)}%`
                            : "Sem leitura gerada ainda"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
                {selectedMatch ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.24em] text-grass">Comparacao ativa</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{selectedMatch.title}</h2>
                        <p className="mt-2 text-sm text-slate-300">
                          {selectedMatch.opponent} • {formatDate(selectedMatch.matchDate)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedMatch.competition ?? "Sem competicao definida"} • Status: {selectedMatch.status}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge tone="info">{selectedPredictionHistory.length} leituras salvas</Badge>
                          <Badge tone={selectedPrediction?.payloadJson?.publicContextId ? "success" : "warning"}>
                            {selectedPrediction?.payloadJson?.publicContextId ? "Com contexto externo" : "Base interna"}
                          </Badge>
                        </div>
                      </div>

                      <Card className="w-full max-w-xl p-4" title="Simular confronto">
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_160px_160px]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={opponentStrengthDraft}
                            onChange={(event) => setOpponentStrengthDraft(event.target.value)}
                            label="Força estimada do adversário"
                            placeholder="Força estimada do adversário"
                          />
                          <Select
                            value={venueContext}
                            onChange={(event) => setVenueContext(event.target.value as "HOME" | "AWAY" | "NEUTRAL")}
                            label="Mando"
                          >
                            <option value="HOME">Mando do clube</option>
                            <option value="AWAY">Mando do adversario</option>
                            <option value="NEUTRAL">Campo neutro</option>
                          </Select>
                          <div className="flex items-end md:col-span-2 xl:col-span-1">
                          <Button
                            type="button"
                            onClick={() => void handlePredict()}
                            disabled={runningPredictionMatchId === selectedMatch.id}
                            className="w-full"
                          >
                            {runningPredictionMatchId === selectedMatch.id ? "Calculando..." : "Gerar previsao"}
                          </Button>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Ajuste o contexto do jogo e gere uma leitura rápida para apoiar a preparação da partida.
                        </p>
                      </Card>
                    </div>

                    {selectedPrediction ? (
                      <>
                        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:p-6">
                          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(110,184,255,0.12),_transparent_62%)]" />
                          <div className="relative space-y-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#edc17a]">Resumo do confronto</p>
                                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                  {favoriteSummary?.title ?? "Sem leitura"}
                                </h3>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                                  {favoriteSummary?.helper ?? "Gere uma previsão para abrir a leitura do confronto."}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Badge tone={favoriteSummary?.tone ?? "info"}>
                                    {selectedPrediction.favoriteTeam === "DRAW" ? "Jogo equilibrado" : "Favorito do momento"}
                                  </Badge>
                                  <Badge tone="info">{selectedPredictionHistory.length} leituras salvas</Badge>
                                  <Badge tone={selectedPrediction.payloadJson?.publicContextId ? "success" : "warning"}>
                                    {selectedPrediction.payloadJson?.publicContextId ? "Com contexto externo" : "Base interna"}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-[30rem]">
                                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Favorito</p>
                                  <p className="mt-3 text-xl font-semibold text-white">{favoriteSummary?.title}</p>
                                  <p className="mt-2 text-sm text-emerald-100/80">Leitura mais forte do confronto atual.</p>
                                </div>
                                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">Confiança</p>
                                  <p className="mt-3 text-xl font-semibold text-white">{selectedPrediction.confidenceScore.toFixed(1)}</p>
                                  <p className="mt-2 text-sm text-sky-100/80">Quanto maior, mais estável a leitura.</p>
                                </div>
                                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                                  <p className="text-xs uppercase tracking-[0.18em] text-amber-100/80">Alertas</p>
                                  <p className="mt-3 text-xl font-semibold text-white">{alertItems.length}</p>
                                  <p className="mt-2 text-sm text-amber-100/80">Pontos que merecem atenção antes do jogo.</p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
                              <Card className="p-4" title="Probabilidades do confronto" subtitle="Leitura visual para entender rapidamente o cenário do jogo.">
                                <ProbabilityBar
                                  homeLabel={leftTeamLabel}
                                  awayLabel={rightTeamLabel}
                                  homeValue={selectedPrediction.homeWinProbability}
                                  drawValue={selectedPrediction.drawProbability}
                                  awayValue={selectedPrediction.awayWinProbability}
                                />
                              </Card>

                              <Card className="p-4" title="Leitura rápida" subtitle="Resumo simples para comissão e direção.">
                                <div className="grid gap-3">
                                  {quickSummaryItems.map((item, index) => (
                                    <div key={index} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-200">
                                      {item}
                                    </div>
                                  ))}
                                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                                    Previsão gerada em {formatDate(selectedPrediction.createdAt)}.
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        </section>

                        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                          <div className="space-y-6">
                            <TeamStrengthComparison
                              leftLabel="Seu lado"
                              leftValue={selectedPrediction.payloadJson?.teamStrengthScore ?? selectedPrediction.homeTeamStrength}
                              rightLabel={selectedMatch.opponent}
                              rightValue={selectedPrediction.payloadJson?.opponentStrengthScore ?? selectedPrediction.awayTeamStrength}
                            />

                            <Card className="p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Explicação simples</p>
                              <p className="mt-3 text-base leading-7 text-slate-100">{selectedPrediction.explanation}</p>
                            </Card>
                          </div>

                          <div className="space-y-6">
                            <Card className="p-4" title="Fatores principais">
                              <div className="mt-4 grid gap-3">
                                {keyFactors.length > 0 ? (
                                  keyFactors.map((factor) => (
                                    <article key={factor.key} className={`rounded-2xl border p-4 ${impactTone[factor.impact]}`}>
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="text-xs uppercase tracking-[0.2em] opacity-80">{impactLabel[factor.impact]}</p>
                                          <p className="mt-2 text-base font-medium opacity-95">{factor.label}</p>
                                          <p className="mt-2 text-sm opacity-90">{factor.detail}</p>
                                        </div>
                                        <p className="text-2xl font-semibold sm:text-right">{factor.value.toFixed(1)}</p>
                                      </div>
                                    </article>
                                  ))
                                ) : (
                                  buildEmptyState(
                                    "Sem fatores detalhados",
                                    "Gere uma nova previsao para popular os fatores explicativos desta analise.",
                                  )
                                )}
                              </div>
                            </Card>

                            <Card className="p-4" title="Alertas e observacoes">
                              <div className="mt-4 grid gap-3">
                                {alertItems.map((item, index) => (
                                  <div key={index} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-200">
                                    {item}
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </div>
                        </div>
                      </>
                    ) : (
                      buildEmptyState(
                        "Nenhuma previsão gerada",
                        "Selecione o contexto da partida e gere a primeira leitura para comparar os dois times.",
                      )
                    )}
                  </div>
                ) : (
                  buildEmptyState("Nenhuma partida selecionada", "Escolha uma partida na coluna lateral para abrir a análise.")
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};
