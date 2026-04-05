import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNotifications } from "./useNotifications";
import { useAuth } from "./useAuth";

export type OnboardingStepId =
  | "athletes"
  | "metrics"
  | "matches"
  | "video"
  | "scout"
  | "intelligence";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  path: string;
};

export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  helper?: string;
  path?: string;
  actionLabel?: string;
};

type OnboardingContextValue = {
  steps: OnboardingStep[];
  tutorialSteps: TutorialStep[];
  completedSteps: Record<OnboardingStepId, boolean>;
  completedCount: number;
  progressPercent: number;
  isGuideOpen: boolean;
  isTutorialOpen: boolean;
  currentTutorialStepIndex: number;
  nextStep: OnboardingStep | null;
  completeStep: (stepId: OnboardingStepId) => void;
  openGuide: () => void;
  closeGuide: () => void;
  toggleGuide: () => void;
  resetGuide: () => void;
  openTutorial: (stepIndex?: number) => void;
  closeTutorial: () => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  finishTutorial: () => void;
  skipTutorial: () => void;
};

type StoredOnboardingState = {
  completedSteps: Partial<Record<OnboardingStepId, boolean>>;
  isGuideOpen: boolean;
};

const defaultCompletedSteps: Record<OnboardingStepId, boolean> = {
  athletes: false,
  metrics: false,
  matches: false,
  video: false,
  scout: false,
  intelligence: false,
};

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Sports AI SaaS",
    description: "Este sistema ajuda você a acompanhar atletas, reduzir risco de lesão e analisar jogos com mais clareza.",
    helper: "Em poucos passos, você entende por onde começar e como tirar valor de cada área.",
  },
  {
    id: "athletes",
    title: "Cadastre seus atletas",
    description: "Comece montando a base do elenco para liberar as análises do sistema.",
    helper: "Com o elenco organizado, fica mais fácil acompanhar desempenho, risco e uso nas partidas.",
    path: "/athletes",
    actionLabel: "Ir para Atletas",
  },
  {
    id: "metrics",
    title: "Adicione dados físicos",
    description: "Inclua métricas físicas para gerar leituras reais de desempenho e carga.",
    helper: "Esses dados alimentam a visão de performance e ajudam a identificar sinais de desgaste.",
    path: "/dashboard",
    actionLabel: "Ver Performance",
  },
  {
    id: "risk",
    title: "Veja o risco do elenco",
    description: "Acompanhe quais atletas pedem mais atenção antes do treino ou do jogo.",
    helper: "A área de performance reúne alertas, tendência recente e prioridades da comissão.",
    path: "/dashboard",
    actionLabel: "Ver Risco",
  },
  {
    id: "matches",
    title: "Cadastre uma partida e envie um vídeo",
    description: "Abra o fluxo do jogo para organizar material, revisar o andamento e preparar as próximas análises.",
    helper: "Partidas e vídeos alimentam Scout e Match Intelligence.",
    path: "/matches",
    actionLabel: "Ir para Partidas",
  },
  {
    id: "scout",
    title: "Visualize análises e mapas de calor",
    description: "Use o Scout para transformar vídeo em leitura visual simples para a comissão técnica.",
    helper: "Mesmo sem dados reais, a tela já mostra o valor do que será entregue.",
    path: "/scout",
    actionLabel: "Abrir Scout",
  },
  {
    id: "intelligence",
    title: "Compare times e entenda o confronto",
    description: "No Match Intelligence, você vê quem chega mais forte, as probabilidades do jogo e os principais fatores do cenário.",
    helper: "A leitura foi feita para ser entendida em poucos segundos.",
    path: "/match-intelligence",
    actionLabel: "Abrir Match Intelligence",
  },
  {
    id: "ready",
    title: "Você está pronto para usar o sistema",
    description: "Agora você já sabe por onde começar e como cada área ajuda na rotina do clube.",
    helper: "Sempre que quiser, você pode reabrir o tutorial pelo botão de ajuda.",
  },
];

const steps: OnboardingStep[] = [
  {
    id: "athletes",
    title: "Cadastrar atletas",
    description: "Monte a base do elenco para liberar os demais módulos.",
    path: "/athletes",
  },
  {
    id: "metrics",
    title: "Registrar métricas físicas",
    description: "Importe ou registre dados para ativar a leitura de performance.",
    path: "/dashboard",
  },
  {
    id: "matches",
    title: "Cadastrar uma partida",
    description: "Abra o fluxo do jogo para organizar vídeos e análises.",
    path: "/matches",
  },
  {
    id: "video",
    title: "Enviar vídeo",
    description: "Anexe o vídeo da partida para iniciar o processamento.",
    path: "/matches",
  },
  {
    id: "scout",
    title: "Visualizar análise scout",
    description: "Entenda onde consultar o material gerado a partir dos vídeos.",
    path: "/scout",
  },
  {
    id: "intelligence",
    title: "Ver inteligência de jogo",
    description: "Abra a leitura pré-jogo com cenários, fatores e probabilidades.",
    path: "/match-intelligence",
  },
];

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const getStorageKey = (clubId: string, userId: string) => `sports_ai_onboarding:${clubId}:${userId}`;
const getCompletionKey = (clubId: string, userId: string) => `onboarding_completed:${clubId}:${userId}`;

const parseStoredState = (value: string | null): StoredOnboardingState => {
  if (!value) {
    return {
      completedSteps: defaultCompletedSteps,
      isGuideOpen: true,
    };
  }

  try {
    const parsed = JSON.parse(value) as StoredOnboardingState;

    return {
      completedSteps: { ...defaultCompletedSteps, ...(parsed.completedSteps ?? {}) },
      isGuideOpen: typeof parsed.isGuideOpen === "boolean" ? parsed.isGuideOpen : true,
    };
  } catch {
    return {
      completedSteps: defaultCompletedSteps,
      isGuideOpen: true,
    };
  }
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { club, user } = useAuth();
  const { notifyInfo } = useNotifications();
  const [completedSteps, setCompletedSteps] = useState<Record<OnboardingStepId, boolean>>(defaultCompletedSteps);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [currentTutorialStepIndex, setCurrentTutorialStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!club?.id || !user?.id) {
      setCompletedSteps(defaultCompletedSteps);
      setIsGuideOpen(false);
      setIsTutorialOpen(false);
      setCurrentTutorialStepIndex(0);
      setIsReady(false);
      return;
    }

    const storedState = parseStoredState(localStorage.getItem(getStorageKey(club.id, user.id)));
    const completionKey = getCompletionKey(club.id, user.id);
    const hasCompletedTutorial = localStorage.getItem(completionKey) === "true";
    setCompletedSteps({ ...defaultCompletedSteps, ...storedState.completedSteps });
    setIsGuideOpen(storedState.isGuideOpen);
    if (!hasCompletedTutorial) {
      localStorage.setItem(completionKey, "true");
      setIsTutorialOpen(true);
    } else {
      setIsTutorialOpen(false);
    }
    setCurrentTutorialStepIndex(0);
    setIsReady(true);
  }, [club?.id, user?.id]);

  useEffect(() => {
    if (!isReady || !club?.id || !user?.id) {
      return;
    }

    localStorage.setItem(
      getStorageKey(club.id, user.id),
      JSON.stringify({
        completedSteps,
        isGuideOpen,
      } satisfies StoredOnboardingState),
    );
  }, [club?.id, completedSteps, isGuideOpen, isReady, user?.id]);

  const completedCount = useMemo(
    () => steps.filter((step) => completedSteps[step.id]).length,
    [completedSteps],
  );
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find((step) => !completedSteps[step.id]) ?? null;

  const value = useMemo<OnboardingContextValue>(
    () => ({
      steps,
      tutorialSteps,
      completedSteps,
      completedCount,
      progressPercent,
      isGuideOpen,
      isTutorialOpen,
      currentTutorialStepIndex,
      nextStep,
      completeStep: (stepId) => {
        setCompletedSteps((current) => {
          if (current[stepId]) {
            return current;
          }

          return { ...current, [stepId]: true };
        });
      },
      openGuide: () => setIsGuideOpen(true),
      closeGuide: () => setIsGuideOpen(false),
      toggleGuide: () => setIsGuideOpen((current) => !current),
      resetGuide: () => {
        setCompletedSteps(defaultCompletedSteps);
        setIsGuideOpen(true);
        notifyInfo("Guia reiniciado", "O checklist voltou ao início para uma nova revisão.");
      },
      openTutorial: (stepIndex = 0) => {
        setCurrentTutorialStepIndex(Math.min(Math.max(stepIndex, 0), tutorialSteps.length - 1));
        setIsTutorialOpen(true);
      },
      closeTutorial: () => setIsTutorialOpen(false),
      nextTutorialStep: () => {
        setCurrentTutorialStepIndex((current) => Math.min(current + 1, tutorialSteps.length - 1));
      },
      previousTutorialStep: () => {
        setCurrentTutorialStepIndex((current) => Math.max(current - 1, 0));
      },
      finishTutorial: () => {
        if (club?.id && user?.id) {
          localStorage.setItem(getCompletionKey(club.id, user.id), "true");
        }
        setIsTutorialOpen(false);
        setCurrentTutorialStepIndex(0);
        notifyInfo("Tutorial concluído", "Você já pode começar a usar o sistema.");
      },
      skipTutorial: () => {
        if (club?.id && user?.id) {
          localStorage.setItem(getCompletionKey(club.id, user.id), "true");
        }
        setIsTutorialOpen(false);
        setCurrentTutorialStepIndex(0);
      },
    }),
    [
      club?.id,
      completedCount,
      completedSteps,
      currentTutorialStepIndex,
      isGuideOpen,
      isTutorialOpen,
      nextStep,
      notifyInfo,
      progressPercent,
      user?.id,
    ],
  );

  useEffect(() => {
    if (completedCount === steps.length && isReady) {
      notifyInfo("Onboarding concluído", "Você já percorreu o fluxo principal da plataforma.");
    }
  }, [completedCount, isReady, notifyInfo]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }

  return context;
};
