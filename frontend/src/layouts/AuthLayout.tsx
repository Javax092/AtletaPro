import { Outlet } from "react-router-dom";

export const AuthLayout = () => (
  <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
    <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0f1c2f]/90 via-[#0b1421]/85 to-[#0a111c]/80 p-8 shadow-[0_30px_80px_rgba(3,8,16,0.45)] md:block lg:p-10">
        <p className="text-xs uppercase tracking-[0.34em] text-[#edc17a]">Performance Intelligence</p>
        <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight text-white lg:text-5xl">
          Plataforma para acompanhar elenco, jogos e decisões da comissão.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
          Feita para clubes que precisam transformar informações do dia a dia em decisões claras e rápidas.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Monitoramento</p>
            <p className="mt-3 text-lg font-semibold text-white">Atletas, carga e risco</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Acompanhe o elenco com foco em treino, desgaste e prevenção.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Jogo</p>
            <p className="mt-3 text-lg font-semibold text-white">Scout e Match Intelligence</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Revise partidas, veja análises visuais e prepare o próximo jogo.</p>
          </div>
        </div>
      </section>

      <div className="app-panel-strong w-full max-w-xl rounded-[2rem] p-6 sm:p-8 lg:p-10 xl:ml-auto">
        <Outlet />
      </div>
    </div>
  </div>
);
