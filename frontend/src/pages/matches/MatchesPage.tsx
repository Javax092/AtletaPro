import axios from "axios";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { matchesApi } from "../../api/matches";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Dialog } from "../../components/common/Dialog";
import { EmptyState } from "../../components/common/EmptyState";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { Select } from "../../components/common/Select";
import { StatCard } from "../../components/common/StatCard";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useNotifications } from "../../hooks/useNotifications";
import type { MatchPayload, MatchSummary, MatchVideo, MatchVideoStatus } from "../../types/match";

const emptyForm: MatchPayload = {
  title: "",
  opponent: "",
  matchDate: "",
  competition: "",
};

const pageSize = 4;

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

const getVideoStatusLabel = (status: MatchVideoStatus) => {
  if (status === "COMPLETED") return "Concluido";
  if (status === "PROCESSING") return "Processando";
  if (status === "FAILED") return "Falhou";
  return "Pendente";
};

const getVideoStatusClassName = (status: MatchVideoStatus) => {
  if (status === "COMPLETED") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "PROCESSING") return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  if (status === "FAILED") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  return "border-amber-400/30 bg-amber-500/15 text-amber-100";
};

const formatMatchDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatFileSize = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: value >= 1024 * 1024 ? 1 : 0,
  }).format(value >= 1024 * 1024 ? value / (1024 * 1024) : value / 1024);

const isVideoPreviewable = (video: MatchVideo) => video.mimeType.startsWith("video/");

export const MatchesPage = () => {
  const { notifyError, notifySuccess, notifyInfo } = useNotifications();
  const { completeStep } = useOnboarding();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [form, setForm] = useState<MatchPayload>(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | MatchVideoStatus>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [previewVideo, setPreviewVideo] = useState<{ name: string; url: string } | null>(null);
  const [previewHeatmap, setPreviewHeatmap] = useState<{ title: string; summary: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingMatchId, setUploadingMatchId] = useState<string | null>(null);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const [previewingVideoId, setPreviewingVideoId] = useState<string | null>(null);
  const [previewingHeatmapId, setPreviewingHeatmapId] = useState<string | null>(null);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState<MatchSummary | null>(null);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<{ matchId: string; video: MatchVideo } | null>(null);

  const loadMatches = async () => {
    setIsLoading(true);
    setListError(null);

    try {
      const data = await matchesApi.list();
      setMatches(data);
    } catch (error) {
      setMatches([]);
      setListError(getErrorMessage(error, "Nao foi possivel carregar as partidas."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    return () => {
      if (previewVideo?.url) {
        URL.revokeObjectURL(previewVideo.url);
      }
      if (previewHeatmap?.url) {
        URL.revokeObjectURL(previewHeatmap.url);
      }
    };
  }, [previewHeatmap, previewVideo]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchTimestamp = new Date(match.matchDate).getTime();
      const fromOk = !dateFrom || matchTimestamp >= new Date(`${dateFrom}T00:00:00`).getTime();
      const toOk = !dateTo || matchTimestamp <= new Date(`${dateTo}T23:59:59`).getTime();
      const statusOk =
        statusFilter === "ALL" ||
        match.videos.some((video) => video.status === statusFilter);

      return fromOk && toOk && statusOk;
    });
  }, [dateFrom, dateTo, matches, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const pagedMatches = filteredMatches.slice((page - 1) * pageSize, page * pageSize);

  const getAnalysisForVideo = (match: MatchSummary, videoId: string) =>
    match.scoutReports.find((report) => report.matchVideoId === videoId && report.analysisType === "HEATMAP");

  const totalVideos = matches.reduce((sum, match) => sum + match.videos.length, 0);
  const totalPendingVideos = matches.reduce(
    (sum, match) => sum + match.videos.filter((video) => video.status === "PENDING").length,
    0,
  );
  const totalProcessedVideos = matches.reduce(
    (sum, match) => sum + match.videos.filter((video) => video.status === "COMPLETED").length,
    0,
  );

  useEffect(() => {
    if (matches.length > 0) {
      completeStep("matches");
    }
  }, [completeStep, matches.length]);

  useEffect(() => {
    if (totalVideos > 0) {
      completeStep("video");
    }
  }, [completeStep, totalVideos]);

  const handleCreateMatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setFormError(null);

    try {
      await matchesApi.create({
        title: form.title.trim(),
        opponent: form.opponent.trim(),
        matchDate: new Date(form.matchDate).toISOString(),
        competition: form.competition?.trim() ? form.competition.trim() : null,
      });
      setForm(emptyForm);
      notifySuccess("Partida criada", "A partida foi cadastrada e já pode receber vídeos.");
      await loadMatches();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel cadastrar a partida.");
      setFormError(message);
      notifyError("Falha ao cadastrar partida", message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadVideo = async (matchId: string) => {
    const file = selectedFiles[matchId];
    if (!file) {
      setUploadError("Selecione um arquivo de vídeo antes de enviar.");
      notifyInfo("Arquivo obrigatório", "Selecione um vídeo antes de iniciar o upload.");
      return;
    }

    setUploadingMatchId(matchId);
    setUploadError(null);

    try {
      await matchesApi.uploadVideo(matchId, file);
      setSelectedFiles((current) => ({ ...current, [matchId]: null }));
      notifySuccess("Upload concluído", "O vídeo foi salvo e entrou com status pendente.");
      await loadMatches();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel enviar o video.");
      setUploadError(message);
      notifyError("Falha no upload", message);
    } finally {
      setUploadingMatchId(null);
    }
  };

  const handlePreviewVideo = async (matchId: string, video: MatchVideo) => {
    setPreviewingVideoId(video.id);
    setUploadError(null);

    try {
      const blob = await matchesApi.getVideoFile(matchId, video.id);
      const url = URL.createObjectURL(blob);
      setPreviewVideo((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url);
        }

        return {
          name: video.originalName,
          url,
        };
      });
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel abrir o video.");
      setUploadError(message);
      notifyError("Falha ao abrir vídeo", message);
    } finally {
      setPreviewingVideoId(null);
    }
  };

  const handleDownloadVideo = async (matchId: string, video: MatchVideo) => {
    setDownloadingVideoId(video.id);
    setUploadError(null);

    try {
      const blob = await matchesApi.downloadVideoFile(matchId, video.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = video.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel baixar o video.");
      setUploadError(message);
      notifyError("Falha ao baixar vídeo", message);
    } finally {
      setDownloadingVideoId(null);
    }
  };

  const handleDeleteVideo = async (matchId: string, videoId: string) => {
    setDeletingVideoId(videoId);
    setUploadError(null);

    try {
      await matchesApi.deleteVideo(matchId, videoId);
      notifySuccess("Vídeo removido", "O arquivo foi excluído da partida.");
      setConfirmDeleteVideo(null);
      await loadMatches();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel remover o video.");
      setUploadError(message);
      notifyError("Falha ao remover vídeo", message);
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    setDeletingMatchId(matchId);
    setUploadError(null);

    try {
      await matchesApi.deleteMatch(matchId);
      notifySuccess("Partida removida", "A partida e seus arquivos associados foram removidos.");
      setConfirmDeleteMatch(null);
      await loadMatches();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel remover a partida.");
      setUploadError(message);
      notifyError("Falha ao remover partida", message);
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleProcessVideo = async (matchId: string, videoId: string) => {
    setProcessingVideoId(videoId);
    setUploadError(null);

    try {
      await matchesApi.processVideo(matchId, videoId);
      notifySuccess("Processamento concluído", "O heatmap inicial do vídeo foi registrado com sucesso.");
      await loadMatches();
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel processar o video.");
      setUploadError(message);
      notifyError("Falha no processamento", message);
      await loadMatches();
    } finally {
      setProcessingVideoId(null);
    }
  };

  const handlePreviewHeatmap = async (analysisId: string, title: string, summary: string) => {
    setPreviewingHeatmapId(analysisId);
    setUploadError(null);

    try {
      const blob = await matchesApi.getHeatmapFile(analysisId);
      const url = URL.createObjectURL(blob);
      setPreviewHeatmap((current) => {
        if (current?.url) {
          URL.revokeObjectURL(current.url);
        }

        return { title, summary, url };
      });
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel abrir o heatmap.");
      setUploadError(message);
      notifyError("Falha ao abrir heatmap", message);
    } finally {
      setPreviewingHeatmapId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partidas e Vídeos"
        subtitle="Organize partidas, envie vídeos e acompanhe o andamento do material que será usado em análise técnica."
        eyebrow="Jogo"
      />

      <WorkflowGuide
        title="Siga o fluxo da partida do cadastro ao material pronto"
        description="Esta tela foi organizada para deixar o caminho evidente: criar a partida, anexar o vídeo e acompanhar o andamento até o material ficar pronto para análise."
        context="É a área onde cada jogo do clube ganha cadastro, arquivos e andamento."
        action="Cadastre a partida, envie o vídeo correspondente e acompanhe o status de cada arquivo logo abaixo."
        value="Centraliza o material de jogo e evita que a comissão perca tempo procurando vídeos ou status."
        steps={[
          { title: "Cadastre o confronto", description: "Crie a partida com adversário, data e competição para abrir o fluxo daquele jogo." },
          { title: "Envie o vídeo correto", description: "Anexe o vídeo da partida para começar a análise e a revisão." },
          { title: "Acompanhe pendências", description: "Use os status para saber o que ainda precisa ser processado ou validado." },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Partidas" value={matches.length} helper="Base atual de confrontos cadastrados." accentClassName="from-[#edc17a]/30" />
        <StatCard label="Vídeos" value={totalVideos} helper="Arquivos enviados para as partidas." accentClassName="from-sky-400/30" />
        <StatCard label="Pendentes" value={totalPendingVideos} helper="Itens que ainda pedem análise ou revisão." accentClassName="from-amber-300/30" />
        <StatCard label="Prontos" value={totalProcessedVideos} helper="Materiais já disponíveis para análise." accentClassName="from-grass/30" />
      </section>

      <Card
        title="Resumo das partidas"
        subtitle="Veja rapidamente o que já entrou no fluxo, o que ainda está pendente e o próximo passo de cada jogo."
        actions={<Badge tone={totalPendingVideos > 0 ? "warning" : "success"}>{totalPendingVideos > 0 ? "Há itens pendentes" : "Operação estável"}</Badge>}
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-label-muted">Leitura de negócio</p>
            <p className="mt-4 text-2xl font-semibold text-white">
              {totalProcessedVideos > 0 ? `${totalProcessedVideos} vídeos já estão prontos para análise` : "Cadastre a primeira partida para começar o fluxo de jogo"}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              O fluxo desta tela cobre a rotina básica do jogo: cadastro, envio do vídeo, acompanhamento do status e acesso ao material gerado.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-label-muted">Filtro ativo</p>
              <p className="mt-4 text-lg font-semibold text-white">{filteredMatches.length} partidas visíveis</p>
              <p className="mt-3 text-sm text-slate-400">O recorte combina datas e status para facilitar a revisão.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-label-muted">Próxima ação</p>
              <p className="mt-4 text-lg font-semibold text-white">{totalPendingVideos > 0 ? "Processar pendências" : "Cadastrar novo confronto"}</p>
              <p className="mt-3 text-sm text-slate-400">O painel destaca o próximo passo natural sem exigir navegação extra.</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          title="Cadastrar partida"
          subtitle="Abra o fluxo de um novo confronto para receber vídeos e análises deste jogo."
        >
          <form className="mt-6 space-y-4" onSubmit={handleCreateMatch}>
            <Input
              label="Título"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Ex.: Rodada 7 em casa"
              required
            />

            <Input
              label="Adversário"
              value={form.opponent}
              onChange={(event) => setForm((current) => ({ ...current, opponent: event.target.value }))}
              placeholder="Ex.: Atletico do Norte"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data e hora"
                type="datetime-local"
                value={form.matchDate}
                onChange={(event) => setForm((current) => ({ ...current, matchDate: event.target.value }))}
                required
              />

              <Input
                label="Competição"
                value={form.competition ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, competition: event.target.value }))}
                placeholder="Opcional"
              />
            </div>

            <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">
              {isCreating ? "Salvando..." : "Criar partida"}
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            {formError ? <FeedbackBanner tone="error" message={formError} /> : null}
          </div>
        </Card>

        <Card
          title="Partidas cadastradas"
          subtitle="Revise as partidas do clube, filtre por status e avance no que ainda está pendente."
          actions={<Badge>MVP local</Badge>}
        >

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Select
              label="Status do vídeo"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | MatchVideoStatus)}
            >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendente</option>
                <option value="PROCESSING">Processando</option>
                <option value="COMPLETED">Concluido</option>
                <option value="FAILED">Falhou</option>
            </Select>

            <Input
              label="Data inicial"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />

            <Input
              label="Data final"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>

          <div className="mt-4 space-y-3">
            {listError ? <FeedbackBanner tone="error" message={listError} /> : null}
            {uploadError ? <FeedbackBanner tone="error" message={uploadError} /> : null}
          </div>

          {isLoading ? (
            <LoadingState className="mt-6" lines={3} cardHeight="h-32" />
          ) : pagedMatches.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhuma partida para os filtros aplicados"
                description="Ajuste os filtros ou cadastre uma nova partida para continuar o fluxo."
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {pagedMatches.map((match) => (
                <article key={match.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge>{match.competition ?? "Sem competição"}</Badge>
                        <Badge tone="info">{match.videos.length} vídeos</Badge>
                        <Badge tone={match.videos.some((video) => video.status === "PENDING") ? "warning" : "success"}>
                          {match.videos.some((video) => video.status === "PENDING") ? "Com pendências" : "Fluxo atualizado"}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold text-white">{match.title}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {match.opponent} • {formatMatchDate(match.matchDate)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {match.competition ?? "Sem competição"} • {match.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        disabled={deletingMatchId === match.id}
                        onClick={() => setConfirmDeleteMatch(match)}
                        variant="danger"
                        size="sm"
                      >
                        {deletingMatchId === match.id ? "Removendo..." : "Excluir partida"}
                      </Button>
                    </div>
                  </div>

                  <Card className="mt-4 rounded-[1.4rem] bg-white/5 p-4">
                    <label className="block space-y-2 text-sm">
                      <span className="app-label">Enviar vídeo</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(event) =>
                          setSelectedFiles((current) => ({
                            ...current,
                            [match.id]: event.target.files?.[0] ?? null,
                          }))
                        }
                        className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-[#edc17a] file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-950"
                      />
                    </label>

                    <Button
                      type="button"
                      disabled={uploadingMatchId === match.id}
                      onClick={() => void handleUploadVideo(match.id)}
                      className="mt-4 w-full sm:w-auto"
                    >
                      {uploadingMatchId === match.id ? "Enviando..." : "Enviar vídeo"}
                    </Button>
                  </Card>

                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">Arquivos</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pipeline local do confronto</p>
                    </div>
                    {match.videos.length === 0 ? (
                      <div className="mt-3">
                        <EmptyState
                          title="Nenhum vídeo anexado"
                          description="Envie o primeiro vídeo desta partida para iniciar a análise deste confronto."
                        />
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {match.videos.map((video) => (
                          <div key={video.id} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                            {(() => {
                              const analysis = getAnalysisForVideo(match, video.id);

                              return (
                                <>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white">{video.originalName}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {formatMatchDate(video.uploadedAt)} • {formatFileSize(video.sizeBytes)} {video.sizeBytes >= 1024 * 1024 ? "MB" : "KB"}
                                </p>
                              </div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getVideoStatusClassName(video.status)}`}>
                                {getVideoStatusLabel(video.status)}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <Button
                                type="button"
                                disabled={processingVideoId === video.id || video.status === "PROCESSING"}
                                onClick={() => void handleProcessVideo(match.id, video.id)}
                                variant="secondary"
                                size="sm"
                                className="border-grass/20 bg-grass/10 text-grass hover:bg-grass/15"
                              >
                                {processingVideoId === video.id || video.status === "PROCESSING" ? "Processando..." : "Processar"}
                              </Button>

                              {isVideoPreviewable(video) ? (
                                <Button
                                  type="button"
                                  disabled={previewingVideoId === video.id}
                                  onClick={() => void handlePreviewVideo(match.id, video)}
                                  variant="secondary"
                                  size="sm"
                                >
                                  {previewingVideoId === video.id ? "Abrindo..." : "Preview"}
                                </Button>
                              ) : null}

                              <Button
                                type="button"
                                disabled={downloadingVideoId === video.id}
                                onClick={() => void handleDownloadVideo(match.id, video)}
                                variant="secondary"
                                size="sm"
                              >
                                {downloadingVideoId === video.id ? "Baixando..." : "Baixar"}
                              </Button>

                              <Button
                                type="button"
                                disabled={deletingVideoId === video.id}
                                onClick={() => setConfirmDeleteVideo({ matchId: match.id, video })}
                                variant="danger"
                                size="sm"
                              >
                                {deletingVideoId === video.id ? "Removendo..." : "Excluir"}
                              </Button>
                            </div>

                            {analysis ? (
                              <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-slate-950/60 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-white">Heatmap gerado</p>
                                    <p className="mt-1 text-xs text-slate-400">{analysis.summary}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    disabled={previewingHeatmapId === analysis.id}
                                    onClick={() => void handlePreviewHeatmap(analysis.id, `${match.title} • ${video.originalName}`, analysis.summary)}
                                    variant="secondary"
                                    size="sm"
                                    className="border-sky-400/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/14"
                                  >
                                    {previewingHeatmapId === analysis.id ? "Abrindo..." : "Ver heatmap"}
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="secondary"
                size="sm"
              >
                Anterior
              </Button>
              <Button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                variant="secondary"
                size="sm"
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog
        open={Boolean(previewVideo)}
        title="Preview do vídeo"
        description={previewVideo?.name}
        onClose={() => {
          if (previewVideo?.url) {
            URL.revokeObjectURL(previewVideo.url);
          }
          setPreviewVideo(null);
        }}
      >
        {previewVideo ? <video controls className="w-full rounded-2xl border border-white/10 bg-black" src={previewVideo.url} /> : null}
      </Dialog>

      <Dialog
        open={Boolean(previewHeatmap)}
        title="Heatmap de movimentacao"
        description={previewHeatmap?.title}
        onClose={() => {
          if (previewHeatmap?.url) {
            URL.revokeObjectURL(previewHeatmap.url);
          }
          setPreviewHeatmap(null);
        }}
      >
        {previewHeatmap ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">{previewHeatmap.summary}</p>
            <img className="w-full rounded-2xl border border-white/10 bg-black" src={previewHeatmap.url} alt="Heatmap da análise" />
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(confirmDeleteMatch)}
        title="Excluir partida"
        description="Essa ação remove a partida e os arquivos ligados a ela."
        onClose={() => setConfirmDeleteMatch(null)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-300">
            Confirme a exclusão de <span className="font-semibold text-white">{confirmDeleteMatch?.title}</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteMatch(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteMatch && void handleDeleteMatch(confirmDeleteMatch.id)}
              disabled={deletingMatchId === confirmDeleteMatch?.id}
            >
              {deletingMatchId === confirmDeleteMatch?.id ? "Removendo..." : "Confirmar exclusão"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(confirmDeleteVideo)}
        title="Excluir vídeo"
        description="O arquivo será removido da lista desta partida."
        onClose={() => setConfirmDeleteVideo(null)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-300">
            Confirme a exclusão de <span className="font-semibold text-white">{confirmDeleteVideo?.video.originalName}</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeleteVideo(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDeleteVideo && void handleDeleteVideo(confirmDeleteVideo.matchId, confirmDeleteVideo.video.id)}
              disabled={deletingVideoId === confirmDeleteVideo?.video.id}
            >
              {deletingVideoId === confirmDeleteVideo?.video.id ? "Removendo..." : "Confirmar exclusão"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
