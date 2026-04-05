import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { scoutApi } from "../../api/scout";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { WorkflowGuide } from "../../components/common/WorkflowGuide";
import { useOnboarding } from "../../hooks/useOnboarding";
import type { ScoutAnalysis } from "../../types/scout";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const workflowSteps = [
  {
    title: "Receber o vídeo da partida",
    description: "O staff sobe o material do jogo e inicia o processamento do confronto no módulo de partidas.",
  },
  {
    title: "Gerar leitura visual",
    description: "O sistema organiza o material gerado para transformar o vídeo em pontos de leitura rápida.",
  },
  {
    title: "Levar para a comissão",
    description: "O Scout vira apoio direto para revisão de jogo, conversa com atletas e preparação do próximo treino.",
  },
];

const practicalUses = [
  "Ajudar a comissão a revisar padrão de ocupação de espaço e comportamento sem bola.",
  "Dar apoio visual para feedback individual ou por setor logo após a partida.",
  "Transformar vídeo bruto em uma leitura objetiva para reunião técnica ou apresentação ao clube.",
];

const demoHighlights = [
  { label: "Corredor mais usado", value: "Lado direito", helper: "Maior volume de ações ofensivas e apoio por fora." },
  { label: "Zona de pressão", value: "Intermediária alta", helper: "Recuperações frequentes após perda no campo rival." },
  { label: "Leitura prática", value: "Ajustar cobertura", helper: "Espaço cedido nas costas do lateral em transição defensiva." },
];

const statusToneByValue: Record<string, "success" | "danger" | "info"> = {
  COMPLETED: "success",
  FAILED: "danger",
  PROCESSING: "info",
};

const statusLabelByValue: Record<string, string> = {
  COMPLETED: "Pronto para leitura",
  FAILED: "Falha no processamento",
  PROCESSING: "Em processamento",
};

const analysisTypeLabels: Record<string, string> = {
  HEATMAP: "Heatmap",
};

const getStatusTone = (status: string) => statusToneByValue[status] ?? "info";

const getStatusLabel = (status: string) => statusLabelByValue[status] ?? status;

const getAnalysisTypeLabel = (analysisType: string) => analysisTypeLabels[analysisType] ?? analysisType;

const DemoHeatmap = () => (
  <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,#0f1f22_0%,#132b2e_100%)] p-4">
    <div className="relative aspect-[1.12/1] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.04))]">
      <div className="absolute inset-4 rounded-[1.2rem] border border-white/10" />
      <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/10" />
      <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      <div className="absolute bottom-4 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border border-white/10" />
      <div className="absolute left-[18%] top-[18%] h-24 w-24 rounded-full bg-[radial-gradient(circle,_rgba(255,211,105,0.7),_rgba(255,102,102,0.32),_transparent_72%)] blur-[2px]" />
      <div className="absolute left-[58%] top-[24%] h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(255,160,122,0.72),_rgba(255,99,71,0.32),_transparent_72%)] blur-[2px]" />
      <div className="absolute left-[42%] top-[48%] h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(255,230,148,0.72),_rgba(255,122,89,0.28),_transparent_72%)]" />
      <div className="absolute left-[70%] top-[56%] h-24 w-24 rounded-full bg-[radial-gradient(circle,_rgba(255,118,118,0.7),_rgba(255,79,79,0.3),_transparent_72%)] blur-[2px]" />
      <div className="absolute bottom-[12%] left-[30%] h-16 w-16 rounded-full bg-[radial-gradient(circle,_rgba(255,205,117,0.62),_rgba(255,123,0,0.18),_transparent_72%)]" />
    </div>

    <div className="mt-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#edc17a]">Preview demonstrativo</p>
        <p className="mt-2 text-sm font-medium text-white">Mapa de ações em zona ofensiva</p>
      </div>
      <Badge tone="warning">Exemplo visual</Badge>
    </div>
  </div>
);

const DemoScoutShowcase = () => (
  <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
    <div className="space-y-6">
      <Card
        title="Exemplo de entrega visual"
        subtitle="Mesmo sem dados do clube, esta prévia mostra como o Scout transforma vídeo em leitura clara para reunião e revisão técnica."
        actions={<Badge tone="warning">Modo apresentação</Badge>}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <DemoHeatmap />

          <div className="space-y-3">
            {demoHighlights.map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-label-muted">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.helper}</p>
              </article>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title="Exemplo de análise"
        subtitle="Modelo de como a comissão pode consumir uma leitura rápida ao fim do processamento."
        actions={<Badge tone="info">Leitura guiada</Badge>}
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Heatmap pronto</Badge>
            <Badge>Últimos 15 minutos</Badge>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">Pressão alta funcionou melhor pelo corredor direito</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            A equipe concentrou recuperações e ações ofensivas no lado direito do ataque. O material sugere vantagem em acelerar a circulação por fora,
            mas também indica atenção à cobertura nas costas do lateral quando a transição defensiva acontece em velocidade.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-label-muted">Para a comissão</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">Leitura rápida para ajustar comportamentos no próximo treino.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-label-muted">Para o atleta</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">Feedback visual mais fácil de entender do que só falar sobre o lance.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-label-muted">Para o clube</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">Demonstra método, organização e capacidade de transformar vídeo em decisão.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div className="space-y-6">
      <Card
        title="Como funciona o Scout"
        subtitle="Fluxo enxuto para mostrar valor antes, durante e depois da análise."
        actions={<Badge tone="success">Simples e demonstrável</Badge>}
      >
        <div className="space-y-3">
          {workflowSteps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card
        title="Valor prático para a comissão"
        subtitle="O Scout não é só um repositório visual. Ele organiza conversa, revisão e tomada de decisão."
      >
        <div className="space-y-3">
          {practicalUses.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </section>
);

export const ScoutPage = () => {
  const { completeStep } = useOnboarding();
  const [items, setItems] = useState<ScoutAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await scoutApi.list();

        if (!ignore) {
          setItems(data);
        }
      } catch (requestError) {
        if (!ignore) {
          setItems([]);
          setError(getErrorMessage(requestError, "Não foi possível carregar as análises de scout."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, []);

  const completedItems = useMemo(() => items.filter((item) => item.status === "COMPLETED"), [items]);
  const latestAnalysis = completedItems[0] ?? items[0] ?? null;
  const remainingItems = latestAnalysis ? items.filter((item) => item.id !== latestAnalysis.id) : [];
  const matchesCovered = new Set(items.map((item) => `${item.match.title}-${item.match.opponent}`)).size;

  useEffect(() => {
    if (!isLoading && !error) {
      completeStep("scout");
    }
  }, [completeStep, error, isLoading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Scout"
        subtitle="Transforme vídeos em uma leitura visual clara para comissão técnica, gestão e apresentações."
        eyebrow="Scout"
      />

      <WorkflowGuide
        title="Use o Scout para transformar vídeo em leitura acionável"
        description="Esta tela foi desenhada para mostrar valor mesmo antes da primeira análise real. Quando houver dados, ela vira uma central de leitura rápida; quando não houver, ainda deixa claro o que o clube vai receber."
        context="É a área visual do Scout, organizada para revisão técnica e apresentação."
        action="Mostre a prévia da tela, explique como o Scout funciona e, quando houver material real, comece pela análise mais recente."
        value="Aumenta percepção de valor do produto e deixa claro como o módulo ajuda na rotina da comissão."
        steps={[
          { title: "Mostre a lógica do módulo", description: "Use a seção de funcionamento para explicar como o vídeo vira material de leitura." },
          { title: "Apresente a prévia visual", description: "Mesmo sem dados reais, a demonstração deixa tangível o resultado esperado." },
          { title: "Quando houver análises, comece pela mais recente", description: "A leitura mais nova deve abrir a conversa com a comissão e o clube." },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Análises disponíveis"
          value={items.length}
          helper={items.length > 0 ? "Materiais já prontos ou em andamento dentro do Scout." : "A vitrine já está pronta para receber as primeiras análises."}
          accentClassName="from-sky-400/30"
        />
        <StatCard
          label="Partidas cobertas"
          value={matchesCovered}
          helper="Quantidade de jogos que já geraram algum material para leitura."
          accentClassName="from-grass/30"
        />
        <StatCard
          label="Prontas para comissão"
          value={completedItems.length}
          helper="Itens já utilizáveis em reunião, revisão e feedback técnico."
          accentClassName="from-amber-300/30"
        />
        <StatCard
          label="Valor percebido"
          value={items.length > 0 ? "Ao vivo" : "Demo ativa"}
          helper="O módulo mantém percepção de valor com ou sem dados reais carregados."
          accentClassName="from-rose-400/30"
        />
      </section>

      <Card
        title="Leitura rápida do Scout"
        subtitle="Resumo visual do momento atual do Scout para abrir a conversa com clareza."
        actions={latestAnalysis ? <Badge tone="success">Análise recente em destaque</Badge> : <Badge tone="warning">Modo apresentação</Badge>}
      >
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
            <p className="text-label-muted">{latestAnalysis ? "Análise mais recente" : "Valor percebido desde o primeiro acesso"}</p>
            <p className="mt-4 text-2xl font-semibold leading-tight text-white">
              {latestAnalysis ? latestAnalysis.match.title : "O Scout apresenta visualmente como o vídeo vira leitura útil para a comissão"}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {latestAnalysis
                ? latestAnalysis.summary
                : "Mesmo antes da primeira análise real, o Scout já mostra como vai apoiar a revisão do jogo, a comunicação interna e a apresentação ao clube."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone={latestAnalysis ? getStatusTone(latestAnalysis.status) : "warning"}>
                {latestAnalysis ? getStatusLabel(latestAnalysis.status) : "Pronto para apresentar"}
              </Badge>
              <Badge>{latestAnalysis ? getAnalysisTypeLabel(latestAnalysis.analysisType) : "Preview visual disponível"}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-label-muted">O que a comissão ganha</p>
              <p className="mt-3 text-lg font-semibold text-white">Leitura rápida e visual</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Menos tempo procurando lances e mais objetividade para revisar comportamentos e padrões do jogo.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-label-muted">Uso prático</p>
              <p className="mt-3 text-lg font-semibold text-white">{latestAnalysis ? "Revisar o último material" : "Apresentar o fluxo do Scout"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {latestAnalysis
                  ? "Comece pela análise destacada para abrir a conversa com a comissão."
                  : "Use a prévia abaixo para mostrar o resultado esperado mesmo sem dados reais."}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="space-y-3">
          <FeedbackBanner tone="error" message={error} />
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </div>
      ) : null}

      {isLoading ? <LoadingState lines={4} cardHeight="h-48" /> : <DemoScoutShowcase />}

      {isLoading ? null : latestAnalysis ? (
        <>
          <Card
            title="Análise mais recente"
            subtitle="Destaque principal para abrir a leitura técnica com a comissão."
            actions={<Badge tone={getStatusTone(latestAnalysis.status)}>{getStatusLabel(latestAnalysis.status)}</Badge>}
          >
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{getAnalysisTypeLabel(latestAnalysis.analysisType)}</Badge>
                    <Badge tone="info">{latestAnalysis.match.opponent}</Badge>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-white">{latestAnalysis.match.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{latestAnalysis.summary}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-label-muted">Leitura central</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">Resumo objetivo do confronto para abrir a discussão sem depender do vídeo inteiro.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-label-muted">Uso imediato</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">Apoio para feedback pós-jogo, ajustes de treino e revisão por setor.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-label-muted">Percepção do clube</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">Entrega mais visual, organizada e fácil de apresentar para gestão e staff.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-label-muted">Leitura rápida</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                      <p className="text-sm font-medium text-white">Partida analisada</p>
                      <p className="mt-2 text-sm text-slate-400">{latestAnalysis.match.title} vs. {latestAnalysis.match.opponent}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                      <p className="text-sm font-medium text-white">Tipo de material</p>
                      <p className="mt-2 text-sm text-slate-400">{getAnalysisTypeLabel(latestAnalysis.analysisType)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4">
                      <p className="text-sm font-medium text-white">Status</p>
                      <p className="mt-2 text-sm text-slate-400">{getStatusLabel(latestAnalysis.status)}</p>
                    </div>
                  </div>
                </div>
                <DemoHeatmap />
              </div>
            </div>
          </Card>

          {remainingItems.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {remainingItems.map((item) => (
                <article key={item.id} className="page-section rounded-[1.6rem]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#edc17a]">{getAnalysisTypeLabel(item.analysisType)}</p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">{item.match.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">Adversário: {item.match.opponent}</p>
                    </div>
                    <Badge tone={getStatusTone(item.status)}>{getStatusLabel(item.status)}</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-label-muted">Partida</p>
                      <p className="mt-3 text-sm font-medium text-white">{item.match.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{item.match.opponent}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-label-muted">Leitura</p>
                      <p className="mt-3 text-sm font-medium text-white">{getAnalysisTypeLabel(item.analysisType)}</p>
                      <p className="mt-2 text-sm text-slate-400">{getStatusLabel(item.status)}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-300">{item.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <Card
          title="O Scout está pronto para a primeira análise real"
          subtitle="Quando o primeiro vídeo for processado, esta área passará a destacar automaticamente o material mais recente do clube."
          actions={<Badge tone="warning">Aguardando material</Badge>}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-label-muted">Próximo passo</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">Cadastrar uma partida, enviar o vídeo e iniciar o processamento.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-label-muted">Valor percebido</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">O Scout já comunica claramente o que será entregue para comissão e clube.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-label-muted">Quando houver dados</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">A análise mais recente entrará em destaque com leitura rápida e cartões de apoio.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
