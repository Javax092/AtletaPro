import { Link, useLocation } from "react-router-dom";
import { Button } from "./Button";
import { useOnboarding } from "../../hooks/useOnboarding";

export const OnboardingChecklist = () => {
  const location = useLocation();
  const {
    steps,
    completedSteps,
    completedCount,
    progressPercent,
    isGuideOpen,
    nextStep,
    openGuide,
    closeGuide,
    resetGuide,
    openTutorial,
  } = useOnboarding();

  if (!isGuideOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" onClick={() => openTutorial(0)} className="shadow-[0_18px_40px_rgba(3,8,16,0.34)]">
            Ver tutorial
          </Button>
          <Button variant="ghost" size="sm" onClick={openGuide}>
            Abrir checklist
          </Button>
        </div>
      </div>
    );
  }

  return (
    <aside className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2rem)] max-w-[24rem] overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/92 shadow-[0_26px_70px_rgba(3,8,16,0.52)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(237,193,122,0.16),rgba(102,209,132,0.08))] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#edc17a]">Primeiros passos</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Guia de onboarding</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Siga este checklist para colocar a plataforma em uso real desde o primeiro acesso.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => openTutorial(0)}>
              Ver tutorial
            </Button>
            <Button variant="ghost" size="sm" onClick={closeGuide}>
              Fechar
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span>{completedCount} de {steps.length} etapas</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#edc17a_0%,#66d184_100%)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {nextStep ? (
            <p className="mt-3 text-sm text-slate-300">
              Próxima etapa: <span className="font-medium text-white">{nextStep.title}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-emerald-200">Fluxo inicial concluído. Você pode reabrir este guia quando quiser.</p>
          )}
        </div>
      </div>

      <div className="max-h-[24rem] space-y-3 overflow-y-auto px-4 py-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[step.id];
          const isActivePage = location.pathname.startsWith(step.path);

          return (
            <article
              key={step.id}
              className={`rounded-2xl border p-4 transition ${
                isCompleted
                  ? "border-emerald-400/20 bg-emerald-400/10"
                  : isActivePage
                    ? "border-[#edc17a]/35 bg-[#edc17a]/10"
                    : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isCompleted
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
                      : "border-white/10 bg-white/10 text-white"
                  }`}
                >
                  {isCompleted ? "OK" : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{step.title}</p>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {isCompleted ? "Concluído" : isActivePage ? "Atual" : "Pendente"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                  <Link
                    to={step.path}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#edc17a] transition hover:text-[#f6d6a0]"
                  >
                    Abrir etapa
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4">
        <p className="text-xs leading-5 text-slate-500">O progresso fica salvo neste navegador.</p>
        <Button variant="ghost" size="sm" onClick={resetGuide}>
          Reiniciar
        </Button>
      </div>
    </aside>
  );
};
