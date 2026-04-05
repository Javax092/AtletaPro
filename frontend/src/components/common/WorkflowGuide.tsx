type WorkflowGuideItem = {
  title: string;
  description: string;
};

type WorkflowGuideProps = {
  title: string;
  description: string;
  context: string;
  action: string;
  value: string;
  steps: WorkflowGuideItem[];
};

export const WorkflowGuide = ({
  title,
  description,
  context,
  action,
  value,
  steps,
}: WorkflowGuideProps) => (
  <section className="app-card overflow-hidden rounded-[1.8rem] p-5 sm:p-6">
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#edc17a]">Fluxo guiado</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-label-muted">O que é isso?</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{context}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-label-muted">O que fazer aqui?</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{action}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-label-muted">Qual o valor?</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">{value}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/55 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Próximos passos</p>
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <article key={`${step.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
      </div>
    </div>
  </section>
);
