import { Link } from "react-router-dom";

export const HomePage = () => (
  <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
    <main className="w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/55 shadow-[0_32px_90px_rgba(3,8,16,0.48)] backdrop-blur-2xl">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="relative p-8 sm:p-12 lg:p-14">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-[#edc17a]/14 via-transparent to-[#66d184]/10" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.36em] text-[#edc17a]">Sports AI SaaS</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
              Informação clara para quem precisa decidir rápido no clube.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Acompanhe atletas, jogos, análises e previsões em uma plataforma pensada para técnicos, gestores e comissões.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/login" className="app-button-primary inline-flex items-center gap-2">
                Entrar no sistema
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/register" className="app-button-secondary">
                Criar clube
              </Link>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Performance</p>
                <h2 className="mt-3 text-lg font-semibold text-white">Atletas e carga</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Leitura contínua do elenco com foco em decisão rápida e prevenção.</p>
              </section>
              <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Scout</p>
                <h2 className="mt-3 text-lg font-semibold text-white">Vídeo e contexto</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Análises visuais para revisar o jogo com mais clareza.</p>
              </section>
              <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Match Intelligence</p>
                <h2 className="mt-3 text-lg font-semibold text-white">Comparação de jogo</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Veja o cenário do confronto com probabilidades e pontos principais.</p>
              </section>
            </div>
          </div>
        </section>

        <aside className="border-t border-white/10 bg-black/10 p-8 sm:p-10 lg:border-l lg:border-t-0">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Visão do produto</p>
            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/15 hover:bg-slate-950/70">
                <p className="text-sm text-slate-400">Confiabilidade</p>
                <p className="mt-2 text-2xl font-semibold text-white">Leitura clara para comissão e gestão</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/15 hover:bg-slate-950/70">
                <p className="text-sm text-slate-400">Operação</p>
                <p className="mt-2 text-2xl font-semibold text-white">Fluxos simples para o dia a dia do clube</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-white/15 hover:bg-slate-950/70">
                <p className="text-sm text-slate-400">Evolução</p>
                <p className="mt-2 text-2xl font-semibold text-white">Base pronta para crescer com o clube</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
);
