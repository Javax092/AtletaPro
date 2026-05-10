import axios from "axios";
import { FormEvent, useEffect, useRef, useState } from "react";
import { athleteApi } from "../../api/athletes";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { TableWrapper } from "../../components/common/TableWrapper";
import { Dialog } from "../../components/common/Dialog";
import { useOnboarding } from "../../hooks/useOnboarding";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useNotifications } from "../../hooks/useNotifications";
import type {
  Athlete,
  AthleteAiProfile,
  AthleteCsvPreviewResponse,
  AthleteFormValues,
  AthleteIntelligencePreview,
  AthletePayload,
} from "../../types/athlete";

const emptyForm: AthleteFormValues = {
  fullName: "",
  position: "",
  birthDate: "",
  externalId: "",
};

const toFormValues = (athlete: Athlete): AthleteFormValues => ({
  fullName: athlete.fullName,
  position: athlete.position,
  birthDate: athlete.birthDate ? athlete.birthDate.slice(0, 10) : "",
  externalId: athlete.externalId ?? "",
});

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

const buildPayload = (form: AthleteFormValues): AthletePayload => ({
  fullName: form.fullName.trim(),
  position: form.position.trim(),
  birthDate: form.birthDate ? form.birthDate : null,
  externalId: form.externalId.trim() ? form.externalId.trim() : null,
});

const calculateAge = (birthDate?: string | null) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

export const AthletesPage = () => {
  const { notifyError, notifySuccess, notifyInfo } = useNotifications();
  const { completeStep } = useOnboarding();
  const formSectionRef = useRef<HTMLElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [form, setForm] = useState<AthleteFormValues>(emptyForm);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [intelligencePreview, setIntelligencePreview] = useState<AthleteIntelligencePreview | null>(null);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  const [aiProfile, setAiProfile] = useState<AthleteAiProfile | null>(null);
  const [isAiProfileLoading, setIsAiProfileLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<AthleteCsvPreviewResponse | null>(null);
  const [isCsvPreviewLoading, setIsCsvPreviewLoading] = useState(false);
  const [isCsvImporting, setIsCsvImporting] = useState(false);

  const loadAthletes = async () => {
    setIsListLoading(true);
    setListError(null);

    try {
      const data = await athleteApi.list();
      setAthletes(data);
      return data;
    } catch (error) {
      setAthletes([]);
      setListError(getErrorMessage(error, "Nao foi possivel carregar os atletas."));
      return [];
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    void loadAthletes();
  }, []);

  useEffect(() => {
    if (athletes.length > 0) {
      completeStep("athletes");
    }
  }, [athletes.length, completeStep]);

  useEffect(() => {
    if (athletes.length === 0) {
      setSelectedAthleteId(null);
      setSelectedAthlete(null);
      setForm(emptyForm);
      setIsCreateMode(true);
      return;
    }

    if (isCreateMode) {
      return;
    }

    if (!selectedAthleteId || !athletes.some((athlete) => athlete.id === selectedAthleteId)) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, isCreateMode, selectedAthleteId]);

  useEffect(() => {
    if (isCreateMode || !selectedAthleteId) {
      setSelectedAthlete(null);
      setDetailError(null);
      setAiProfile(null);
      return;
    }

    let ignore = false;

    const loadDetail = async () => {
      setIsDetailLoading(true);
      setDetailError(null);

      try {
        const athlete = await athleteApi.getById(selectedAthleteId);

        if (!ignore) {
          setSelectedAthlete(athlete);
          setForm(toFormValues(athlete));
        }
      } catch (error) {
        if (!ignore) {
          setSelectedAthlete(null);
          setDetailError(getErrorMessage(error, "Nao foi possivel carregar os detalhes do atleta."));
        }
      } finally {
        if (!ignore) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [isCreateMode, selectedAthleteId]);

  useEffect(() => {
    const hasMinimumInput = form.fullName.trim().length >= 2 || form.position.trim().length >= 2 || form.birthDate.trim().length > 0;

    if (!hasMinimumInput) {
      setIntelligencePreview(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsIntelligenceLoading(true);

      try {
        const result = await athleteApi.previewIntelligence({
          fullName: form.fullName,
          position: form.position,
          birthDate: form.birthDate || null,
        });
        setIntelligencePreview(result);
      } catch {
        setIntelligencePreview(null);
      } finally {
        setIsIntelligenceLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [form.birthDate, form.fullName, form.position]);

  useEffect(() => {
    if (isCreateMode || !selectedAthleteId) {
      setAiProfile(null);
      return;
    }

    let ignore = false;

    const loadAiProfile = async () => {
      setIsAiProfileLoading(true);

      try {
        const result = await athleteApi.getAiProfile(selectedAthleteId);
        if (!ignore) {
          setAiProfile(result);
        }
      } catch {
        if (!ignore) {
          setAiProfile(null);
        }
      } finally {
        if (!ignore) {
          setIsAiProfileLoading(false);
        }
      }
    };

    void loadAiProfile();

    return () => {
      ignore = true;
    };
  }, [isCreateMode, selectedAthleteId]);

  const startCreate = () => {
    setIsCreateMode(true);
    setSelectedAthleteId(null);
    setSelectedAthlete(null);
    setForm(emptyForm);
    setDetailError(null);
    setFormError(null);
    notifyInfo("Novo cadastro", "Preencha os dados do atleta para criar um novo registro.");

    window.requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      firstFieldRef.current?.focus();
    });
  };

  const selectAthlete = (athleteId: string) => {
    setIsCreateMode(false);
    setSelectedAthleteId(athleteId);
    setFormError(null);
  };

  const handleCsvPreview = async () => {
    if (!csvFile) {
      notifyInfo("Arquivo obrigatório", "Selecione um CSV para gerar a prévia inteligente.");
      return;
    }

    setIsCsvPreviewLoading(true);

    try {
      const preview = await athleteApi.previewCsvImport(csvFile);
      setCsvPreview(preview);
      notifySuccess("Prévia pronta", "O CSV foi analisado e está pronto para revisão antes do salvamento.");
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel analisar o CSV informado.");
      notifyError("Falha na prévia do CSV", message);
    } finally {
      setIsCsvPreviewLoading(false);
    }
  };

  const handleCsvCommit = async () => {
    if (!csvPreview) {
      return;
    }

    setIsCsvImporting(true);

    try {
      const payload = csvPreview.rows
        .filter((row) => row.validation.isValid)
        .map((row) => ({
          ...row.normalizedAthlete,
          metric: row.metricDraft ?? undefined,
        }));

      const result = await athleteApi.commitCsvImport(payload);
      await loadAthletes();
      notifySuccess("Importação concluída", `${result.totalCreated} atletas importados com sucesso.`);
      setCsvPreview(null);
      setCsvFile(null);
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel concluir a importacao inteligente.");
      notifyError("Falha na importação", message);
    } finally {
      setIsCsvImporting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      const payload = buildPayload(form);

      if (isCreateMode) {
        const createdAthlete = await athleteApi.create(payload);
        const data = await loadAthletes();
        setIsCreateMode(false);
        setSelectedAthleteId(createdAthlete.id ?? data[0]?.id ?? null);
        notifySuccess("Atleta criado", "O cadastro foi salvo e já está disponível na base do clube.");
      } else if (selectedAthleteId) {
        const updatedAthlete = await athleteApi.update(selectedAthleteId, payload);
        setSelectedAthlete(updatedAthlete);
        setForm(toFormValues(updatedAthlete));
        await loadAthletes();
        notifySuccess("Atleta atualizado", "As informações do atleta foram salvas com sucesso.");
      }
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel salvar o atleta.");
      setFormError(message);
      notifyError("Falha ao salvar atleta", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedAthleteId) {
      return;
    }

    setIsDeactivating(true);
    setFormError(null);

    try {
      await athleteApi.deactivate(selectedAthleteId);
      const data = await loadAthletes();
      notifySuccess("Atleta inativado", "O registro foi removido da operação ativa do clube.");
      setConfirmDeactivateOpen(false);

      if (data.length > 0) {
        setIsCreateMode(false);
        setSelectedAthleteId(data[0].id);
      } else {
        startCreate();
      }
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel inativar o atleta.");
      setFormError(message);
      notifyError("Falha ao inativar atleta", message);
    } finally {
      setIsDeactivating(false);
    }
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      athlete.fullName.toLowerCase().includes(search) ||
      athlete.position.toLowerCase().includes(search) ||
      (athlete.externalId ?? "").toLowerCase().includes(search)
    );
  });

  const athletesWithExternalId = athletes.filter((athlete) => Boolean(athlete.externalId)).length;
  const selectedAthleteAge = calculateAge(selectedAthlete?.birthDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base do Elenco"
        subtitle="Cadastre, organize e mantenha o elenco atualizado para que todo o sistema trabalhe com a base correta."
        eyebrow="Atletas"
      />

      <Card className="overflow-hidden border border-[#edc17a]/15 bg-gradient-to-br from-[#edc17a]/8 via-white/[0.03] to-[#66d184]/8 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#edc17a]">Area de cadastro</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Insercao de atletas fica neste modulo</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Use o botao abaixo para abrir o formulario. Em telas menores, o formulario aparece logo abaixo da lista de elenco.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={startCreate}>
              Inserir novo atleta
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Ir para formulario
            </Button>
          </div>
        </div>
      </Card>

      <WorkflowGuide
        title="Tudo começa com um elenco bem organizado"
        description="Esta é a base do sistema. Quando o elenco está completo e atualizado, fica mais fácil acompanhar desempenho, organizar partidas e evitar retrabalho."
        context="Aqui ficam os cadastros dos atletas ativos do clube."
        action="Busque um nome para editar um atleta existente ou crie um novo cadastro para completar a base."
        value="Garante que relatórios, alertas e análises sejam vinculados ao atleta certo."
        steps={[
          { title: "Cadastre quem ainda não está na base", description: "Use o botão de novo atleta para incluir jogadores que entrarão na rotina do clube." },
          { title: "Revise posição e dados principais", description: "Mantenha nome, posição e data de nascimento corretos para evitar confusão nas próximas telas." },
          { title: "Inative apenas quem saiu da operação", description: "A inativação limpa a rotina atual sem perder o histórico do atleta." },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-label-muted">Atletas ativos</p>
          <p className="mt-4 text-3xl font-semibold text-white">{athletes.length}</p>
          <p className="mt-3 text-sm text-slate-400">Elenco disponível para acompanhamento e análise.</p>
        </Card>
        <Card className="p-5">
          <p className="text-label-muted">Com integração</p>
          <p className="mt-4 text-3xl font-semibold text-white">{athletesWithExternalId}</p>
          <p className="mt-3 text-sm text-slate-400">Registros já ligados a IDs externos para expansão futura.</p>
        </Card>
        <Card className="p-5">
          <p className="text-label-muted">Modo atual</p>
          <p className="mt-4 text-2xl font-semibold text-white">{isCreateMode ? "Novo cadastro" : "Detalhe ativo"}</p>
          <p className="mt-3 text-sm text-slate-400">A tela alterna entre criação rápida e edição do atleta selecionado.</p>
        </Card>
        <Card className="p-5">
          <p className="text-label-muted">Atleta em foco</p>
          <p className="mt-4 text-2xl font-semibold text-white">{selectedAthlete?.fullName ?? "Nenhum selecionado"}</p>
          <p className="mt-3 text-sm text-slate-400">
            {selectedAthlete ? `${selectedAthlete.position} • atualizado em ${new Date(selectedAthlete.updatedAt).toLocaleDateString("pt-BR")}` : "Selecione um item da lista para abrir o detalhe completo."}
          </p>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <section className="page-section overflow-hidden p-0">
          <div className="app-hairline flex items-center justify-between border-b border-white/10 px-5 py-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Elenco</h2>
              <p className="text-sm text-slate-400">Selecione um atleta para revisar ou comece um novo cadastro.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={startCreate}>
              Novo atleta
            </Button>
          </div>

          <div className="border-b border-white/8 px-5 py-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                label="Buscar no elenco"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, posição ou ID externo"
              />
              <div className="flex items-center gap-3 pb-1">
                <Badge tone="info">{filteredAthletes.length} visíveis</Badge>
                {!isCreateMode && selectedAthlete ? <Badge tone="success">Cadastro em revisão</Badge> : <Badge>Pronto para novo cadastro</Badge>}
              </div>
            </div>
          </div>

          {isListLoading ? (
            <LoadingState className="px-5 py-6" />
          ) : listError ? (
            <div className="space-y-4 px-5 py-10 text-sm">
              <FeedbackBanner tone="error" message={listError} />
              <Button type="button" variant="secondary" size="sm" onClick={() => void loadAthletes()}>
                Tentar novamente
              </Button>
            </div>
          ) : athletes.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Nenhum atleta ativo cadastrado"
                description="Crie o primeiro atleta no formulário ao lado para iniciar a base do elenco."
                action={
                  <Button type="button" onClick={startCreate}>
                    Cadastrar primeiro atleta
                  </Button>
                }
              />
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="Nenhum atleta encontrado"
                description="Ajuste a busca para localizar outro nome, posição ou identificador."
              />
            </div>
          ) : (
            <TableWrapper>
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Posicao</th>
                    <th>Integração</th>
                    <th>Nascimento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.map((athlete) => {
                    const isSelected = !isCreateMode && selectedAthleteId === athlete.id;

                    return (
                      <tr
                        key={athlete.id}
                        className={`cursor-pointer border-t border-white/5 transition ${
                          isSelected ? "bg-white/[0.08]" : "hover:bg-white/5"
                        }`}
                        onClick={() => selectAthlete(athlete.id)}
                      >
                        <td className="px-4 py-3 font-medium text-white">{athlete.fullName}</td>
                        <td className="px-4 py-3 text-slate-300">{athlete.position}</td>
                        <td className="px-4 py-3">
                          {athlete.externalId ? <Badge tone="info">Vinculado</Badge> : <Badge>Local</Badge>}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{athlete.birthDate ? athlete.birthDate.slice(0, 10) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </section>

        <Card
          ref={formSectionRef}
          title={isCreateMode ? "Cadastrar novo atleta" : "Revisar cadastro do atleta"}
          subtitle={
            isCreateMode
              ? "Preencha os dados principais para incluir um novo atleta na base."
              : "Atualize as informações do atleta selecionado ou retire-o da operação atual."
          }
          actions={!isCreateMode && selectedAthlete ? <Badge tone="success">Ativo</Badge> : null}
        >
          {!isCreateMode && selectedAthlete ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-label-muted">Posição</p>
                <p className="mt-3 text-lg font-semibold text-white">{selectedAthlete.position}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-label-muted">Idade</p>
                <p className="mt-3 text-lg font-semibold text-white">{selectedAthleteAge ?? "--"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-label-muted">Integração</p>
                <p className="mt-3 text-lg font-semibold text-white">{selectedAthlete.externalId ? "Ativa" : "Local"}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {formError ? <FeedbackBanner tone="error" message={formError} /> : null}
            {detailError ? <FeedbackBanner tone="error" message={detailError} /> : null}
          </div>

          {isDetailLoading ? (
            <LoadingState className="mt-6" />
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {isCreateMode ? (
                <div className="rounded-2xl border border-dashed border-[#edc17a]/25 bg-[#edc17a]/6 px-4 py-3 text-sm text-slate-200">
                  Esta e a area de insercao. Preencha os campos abaixo e clique em <span className="font-semibold text-white">Criar atleta</span>.
                </div>
              ) : null}

              <Input
                ref={firstFieldRef}
                label="Nome completo"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Ex.: Joao Silva"
                required
              />

              <Input
                label="Posicao"
                value={form.position}
                onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
                placeholder="Ex.: Zagueiro"
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Data de nascimento"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
                />

                <Input
                  label="ID externo"
                  value={form.externalId}
                  onChange={(event) => setForm((current) => ({ ...current, externalId: event.target.value }))}
                  placeholder="Opcional"
                />
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">Cadastro inteligente</p>
                    <p className="mt-1 text-sm text-slate-400">A IA padroniza a posição e tenta encontrar duplicidades antes do salvamento.</p>
                  </div>
                  {isIntelligenceLoading ? <Badge tone="info">Analisando</Badge> : <Badge tone="success">IA ativa</Badge>}
                </div>

                {intelligencePreview ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-label-muted">Padronização sugerida</p>
                      <p className="mt-3 text-sm text-slate-200">Nome: {intelligencePreview.normalized.fullName ?? "--"}</p>
                      <p className="mt-2 text-sm text-slate-200">Posição: {intelligencePreview.normalized.position ?? "--"}</p>
                      <p className="mt-3 text-xs leading-6 text-slate-400">{intelligencePreview.normalized.explainability.summary}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-label-muted">Possíveis duplicidades</p>
                      {intelligencePreview.duplicates.matches.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {intelligencePreview.duplicates.matches.map((candidate) => (
                            <div key={candidate.athleteId} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-white">{candidate.athlete.fullName}</p>
                                <Badge tone={candidate.confidence === "HIGH" ? "danger" : candidate.confidence === "MEDIUM" ? "warning" : "info"}>
                                  {Math.round(candidate.score * 100)}%
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">{candidate.reasons.join(" ")}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">Nenhum cadastro muito parecido encontrado neste clube.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Preencha nome, posição ou nascimento para ativar a análise.</p>
                )}
              </div>

              {!isCreateMode && selectedAthlete ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <p>ID do atleta: {selectedAthlete.id}</p>
                  <p className="mt-1">Atualizado em: {new Date(selectedAthlete.updatedAt).toLocaleString("pt-BR")}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={isSaving || isDetailLoading}>
                  {isSaving ? "Salvando..." : isCreateMode ? "Criar atleta" : "Salvar alteracoes"}
                </Button>

                {!isCreateMode ? (
                  <Button
                    type="button"
                    onClick={() => setConfirmDeactivateOpen(true)}
                    disabled={isDeactivating || isSaving || isDetailLoading}
                    variant="danger"
                  >
                    {isDeactivating ? "Inativando..." : "Inativar atleta"}
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card
          title="Importação inteligente via CSV"
          subtitle="Suba um arquivo com cabeçalhos variados. O sistema identifica colunas, padroniza os atletas e mostra uma prévia editável antes de gravar."
          actions={<Badge tone="info">CSV + IA</Badge>}
        >
          <div className="space-y-4">
            <Input type="file" accept=".csv,text/csv" onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)} />
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => void handleCsvPreview()} disabled={isCsvPreviewLoading}>
                {isCsvPreviewLoading ? "Analisando CSV..." : "Gerar prévia inteligente"}
              </Button>
              {csvPreview ? (
                <Button type="button" variant="secondary" onClick={() => void handleCsvCommit()} disabled={isCsvImporting}>
                  {isCsvImporting ? "Importando..." : "Confirmar importação"}
                </Button>
              ) : null}
            </div>

            {csvPreview ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-label-muted">Linhas lidas</p>
                    <p className="mt-3 text-xl font-semibold text-white">{csvPreview.summary.totalRows}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-label-muted">Colunas reconhecidas</p>
                    <p className="mt-3 text-xl font-semibold text-white">{csvPreview.summary.detectedColumns}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-label-muted">Linhas com issues</p>
                    <p className="mt-3 text-xl font-semibold text-white">{csvPreview.summary.rowsWithIssues}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-label-muted">Preview carregada</p>
                    <p className="mt-3 text-xl font-semibold text-white">{csvPreview.summary.previewRows}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">Mapeamento de colunas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {csvPreview.detectedColumns.map((column) => (
                      <Badge key={`${column.source}-${column.mappedField ?? "none"}`} tone={column.mappedField ? "success" : "info"}>
                        {column.source} → {column.mappedField ?? "não mapeada"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {csvPreview.rows.map((row) => (
                    <div key={row.tempId} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{row.normalizedAthlete.fullName || "Linha sem nome válido"}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {row.normalizedAthlete.position || "Sem posição"} {row.normalizedAthlete.birthDate ? `• ${row.normalizedAthlete.birthDate}` : ""}
                          </p>
                        </div>
                        {row.validation.isValid ? <Badge tone="success">Pronto para importar</Badge> : <Badge tone="danger">Revisão necessária</Badge>}
                      </div>
                      {row.duplicateMatches.length > 0 ? (
                        <p className="mt-3 text-xs text-amber-200">
                          Possível duplicidade com: {row.duplicateMatches.map((candidate) => candidate.athlete.fullName).join(", ")}.
                        </p>
                      ) : null}
                      {row.validation.issues.length > 0 ? <p className="mt-2 text-xs text-rose-200">{row.validation.issues.join(" ")}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          title="Perfil inteligente do atleta"
          subtitle="Resumo técnico, condição física, tendência de performance e explicação dos sinais usados pela IA."
          actions={!isCreateMode && selectedAthlete ? <Badge tone="success">Atleta selecionado</Badge> : <Badge tone="info">Selecione um atleta</Badge>}
        >
          {isCreateMode ? (
            <EmptyState
              title="Selecione um atleta para ver o perfil IA"
              description="O perfil automático usa o histórico recente do atleta para resumir condição e tendência."
            />
          ) : isAiProfileLoading ? (
            <LoadingState className="mt-2" />
          ) : aiProfile ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-label-muted">Resumo técnico</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{aiProfile.technicalProfile.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-label-muted">Condição física</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{aiProfile.physicalCondition.summary}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-label-muted">Tendência de performance</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{aiProfile.performanceTrend.summary}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-[#edc17a]/30 bg-[#edc17a]/6 p-4">
                <p className="text-sm font-medium text-white">{aiProfile.explainability.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{aiProfile.explainability.summary}</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  {aiProfile.explainability.factors.map((factor) => (
                    <li key={factor}>• {factor}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyState title="Perfil indisponível" description="Ainda não foi possível gerar o perfil inteligente para este atleta." />
          )}
        </Card>
      </div>

      <Dialog
        open={confirmDeactivateOpen}
        title="Inativar atleta"
        description="Essa ação retira o atleta da rotina atual, mas mantém o histórico já salvo."
        onClose={() => setConfirmDeactivateOpen(false)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-300">
            Confirme a inativação de <span className="font-semibold text-white">{selectedAthlete?.fullName ?? "atleta selecionado"}</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setConfirmDeactivateOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void handleDeactivate()} disabled={isDeactivating}>
              {isDeactivating ? "Inativando..." : "Confirmar inativação"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
