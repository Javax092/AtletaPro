import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { useOnboarding } from "../../hooks/useOnboarding";

const tutorialVisuals = [
  {
    eyebrow: "Boas-vindas",
    headline: "Comece com uma visão simples do sistema",
    bullets: [
      "Acompanhe o elenco em um só lugar.",
      "Veja sinais de risco antes que virem problema.",
      "Revise jogos e cenários com mais clareza.",
    ],
  },
  {
    eyebrow: "Atletas",
    headline: "Tudo começa com o elenco organizado",
    bullets: [
      "Cadastre os jogadores que fazem parte da rotina do clube.",
      "Mantenha posição e dados principais atualizados.",
      "Use essa base em todas as outras áreas do sistema.",
    ],
  },
  {
    eyebrow: "Performance",
    headline: "Dados físicos viram leitura prática",
    bullets: [
      "Importe ou registre dados do grupo.",
      "Acompanhe carga, fadiga e tendência da semana.",
      "Ganhe uma visão mais clara para ajustar o trabalho.",
    ],
  },
  {
    eyebrow: "Risco",
    headline: "Priorize quem precisa de atenção",
    bullets: [
      "Veja quem está fora do padrão.",
      "Antecipe ajustes antes do treino ou do jogo.",
      "Apoie a conversa entre campo, preparação e saúde.",
    ],
  },
  {
    eyebrow: "Jogo",
    headline: "Organize partidas e vídeos sem perder o fluxo",
    bullets: [
      "Cadastre o confronto.",
      "Envie o vídeo certo para iniciar a análise.",
      "Acompanhe o andamento do material na mesma tela.",
    ],
  },
  {
    eyebrow: "Scout",
    headline: "Transforme vídeo em leitura visual",
    bullets: [
      "Veja mapas e análises em uma tela pronta para apresentação.",
      "Use o material para revisar o jogo com mais objetividade.",
      "Mostre valor para staff, atletas e gestão.",
    ],
  },
  {
    eyebrow: "Match Intelligence",
    headline: "Entenda o confronto em poucos segundos",
    bullets: [
      "Compare os times lado a lado.",
      "Veja o favorito e as probabilidades do jogo.",
      "Entenda rapidamente os fatores principais do cenário.",
    ],
  },
  {
    eyebrow: "Pronto",
    headline: "Seu ponto de partida está definido",
    bullets: [
      "Cadastre o elenco.",
      "Alimente os dados físicos.",
      "Abra partidas, vídeos e análises conforme a rotina avançar.",
    ],
  },
];

export const OnboardingTour = () => {
  const navigate = useNavigate();
  const {
    tutorialSteps,
    isTutorialOpen,
    currentTutorialStepIndex,
    previousTutorialStep,
    nextTutorialStep,
    finishTutorial,
    skipTutorial,
  } = useOnboarding();

  const currentStep = tutorialSteps[currentTutorialStepIndex];
  const currentVisual = tutorialVisuals[currentTutorialStepIndex] ?? tutorialVisuals[0];
  const isFirstStep = currentTutorialStepIndex === 0;
  const isLastStep = currentTutorialStepIndex === tutorialSteps.length - 1;
  const progressPercent = Math.round(((currentTutorialStepIndex + 1) / tutorialSteps.length) * 100);

  const actionLabel = useMemo(() => {
    if (isLastStep) {
      return "Começar agora";
    }

    return currentStep.actionLabel ?? "Próximo";
  }, [currentStep.actionLabel, isLastStep]);

  if (!isTutorialOpen) {
    return null;
  }

  return (
    <div className="app-dialog-backdrop" role="dialog" aria-modal="true" aria-label="Tutorial inicial">
      <div className="app-dialog-panel max-w-5xl overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative overflow-hidden border-b border-white/10 bg-[linear-gradient(135deg,rgba(237,193,122,0.12),rgba(102,209,132,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(110,184,255,0.14),_transparent_65%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.28em] text-[#edc17a]">{currentVisual.eyebrow}</p>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {currentVisual.headline}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">{currentStep.description}</p>

              <div className="mt-8 space-y-3">
                {currentVisual.bullets.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Passo {currentTutorialStepIndex + 1} de {tutorialSteps.length}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{currentStep.title}</h3>
                {currentStep.helper ? <p className="mt-3 text-sm leading-7 text-slate-400">{currentStep.helper}</p> : null}
              </div>
              <Button variant="ghost" size="sm" onClick={skipTutorial}>
                Pular tutorial
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                <span>Progresso</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#edc17a_0%,#66d184_100%)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
              <p className="text-label-muted">O que fazer aqui?</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{currentStep.description}</p>
            </div>

            <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-5">
              <p className="text-label-muted">Por que isso importa?</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {currentStep.helper ?? "Esse passo ajuda você a começar a usar a plataforma com mais clareza."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={previousTutorialStep} disabled={isFirstStep}>
                  Voltar
                </Button>
                {!isLastStep ? (
                  <Button variant="primary" onClick={nextTutorialStep}>
                    Próximo
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {currentStep.path && currentStep.actionLabel ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate(currentStep.path!);
                    }}
                  >
                    {currentStep.actionLabel}
                  </Button>
                ) : null}

                {isLastStep ? (
                  <>
                    <Button variant="primary" onClick={finishTutorial}>
                      Começar agora
                    </Button>
                    <Button variant="ghost" onClick={finishTutorial}>
                      Fechar
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
