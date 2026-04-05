import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
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
import type { Athlete, AthleteFormValues, AthletePayload } from "../../types/athlete";

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

  const startCreate = () => {
    setIsCreateMode(true);
    setSelectedAthleteId(null);
    setSelectedAthlete(null);
    setForm(emptyForm);
    setDetailError(null);
    setFormError(null);
    notifyInfo("Novo cadastro", "Preencha os dados do atleta para criar um novo registro.");
  };

  const selectAthlete = (athleteId: string) => {
    setIsCreateMode(false);
    setSelectedAthleteId(athleteId);
    setFormError(null);
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
              <Input
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
