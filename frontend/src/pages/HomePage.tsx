import { Link } from "react-router-dom";

const benefits = [
  {
    eyebrow: "Monitoramento de atletas",
    title: "Leitura consolidada do elenco",
    description: "Centralize status fisico, disponibilidade, carga e indicadores individuais para orientar decisoes do dia a dia.",
  },
  {
    eyebrow: "Gestao de performance",
    title: "Rotina operacional mais clara",
    description: "Organize acompanhamento tecnico, historico de evolucao e prioridades da comissao em uma unica plataforma.",
  },
  {
    eyebrow: "Inteligencia esportiva",
    title: "Dados transformados em contexto",
    description: "Combine informacoes de atletas, confrontos e alertas para sustentar decisoes com mais consistencia.",
  },
];

const workflow = [
  "Cadastre atletas, equipes e contextos operacionais em um ambiente unico.",
  "Acompanhe performance, risco fisico e disponibilidade com atualizacao centralizada.",
  "Compartilhe leituras objetivas com comissao tecnica, scout e gestao.",
];

const modules = [
  {
    title: "Painel executivo",
    description: "Visao sintetica do elenco, principais alertas e indicadores prioritarios para cada janela de decisao.",
  },
  {
    title: "Performance e risco fisico",
    description: "Acompanhe sinais de desgaste, retorno, prontidao competitiva e pontos de atencao do grupo.",
  },
  {
    title: "Analise esportiva",
    description: "Estruture leituras de jogo, perfis de atletas e inteligencia aplicada a confronto e planejamento.",
  },
  {
    title: "Governanca de dados",
    description: "Padronize registros, historico operacional e rastreabilidade para decisoes baseadas em dados.",
  },
];

const trustPoints = [
  "Ambiente centralizado para clube, escolinha ou departamento de analise.",
  "Fluxos desenhados para reduzir ruido operacional e acelerar tomada de decisao.",
  "Base preparada para evoluir com novas rotinas, integracoes e inteligencia aplicada.",
];

export const HomePage = () => (
  <div className="app-shell min-h-screen px-4 py-6 sm:px-6 lg:px-8">
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/70 shadow-[0_32px_90px_rgba(3,8,16,0.48)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(237,193,122,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(102,209,132,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_60%)]" />
        <div className="relative grid gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-14 lg:py-14">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-[#edc17a]">AtletaPro</p>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                Inteligencia esportiva para monitorar atletas, proteger performance e decidir com mais seguranca.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Plataforma para clubes, escolinhas e analistas esportivos que precisam acompanhar evolucao, risco fisico e desempenho com criterio operacional e visao de negocio.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/login" className="app-button-primary inline-flex items-center gap-2">
                  Acessar plataforma
                  <span aria-hidden="true">→</span>
                </Link>
                <Link to="/register" className="app-button-secondary">
                  Criar conta
                </Link>
                <Link to="/register" className="app-button-secondary">
                  Solicitar acesso
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {benefits.map((item) => (
                <section key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{item.eyebrow}</p>
                  <h2 className="mt-3 text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </section>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Direcao operacional</p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-[1.6rem] border border-[#edc17a]/20 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Visao do elenco</p>
                  <p className="mt-2 text-3xl font-semibold text-white">Performance, risco e disponibilidade em um unico painel.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-5">
                    <p className="text-sm text-slate-400">Tomada de decisao</p>
                    <p className="mt-2 text-xl font-semibold text-white">Indicadores objetivos para staff e gestao.</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-5">
                    <p className="text-sm text-slate-400">Escalabilidade</p>
                    <p className="mt-2 text-xl font-semibold text-white">Estrutura pronta para crescimento e governanca.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Seguranca e dados</p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                {trustPoints.map((item) => (
                  <li key={item} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#edc17a]">Como funciona</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Fluxo claro para acompanhar o que importa.</h2>
          <div className="mt-8 space-y-4">
            {workflow.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#edc17a]/30 bg-[#edc17a]/10 text-sm font-semibold text-[#edc17a]">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#edc17a]">Modulos do sistema</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
                <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{module.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(237,193,122,0.12),rgba(102,209,132,0.08),rgba(255,255,255,0.03))] px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#edc17a]">Chamada final</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Estruture sua operacao com uma plataforma preparada para decisoes baseadas em dados.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Reuna monitoramento de atletas, gestao de performance e inteligencia esportiva em uma experiencia mais profissional para o staff e para a direcao.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="app-button-primary inline-flex items-center gap-2">
              Entrar
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/register" className="app-button-secondary">
              Criar conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  </div>
);
