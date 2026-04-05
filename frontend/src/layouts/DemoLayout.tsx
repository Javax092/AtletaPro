import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/demo/dashboard", label: "Dashboard" },
  { to: "/demo/athletes", label: "Atletas" },
  { to: "/demo/alerts", label: "Alertas" },
  { to: "/demo/match-intelligence", label: "Match Intelligence" },
];

export const DemoLayout = () => (
  <div className="app-shell min-h-screen px-3 py-3 text-slate-100">
    <div className="mx-auto grid min-h-screen max-w-[1520px] gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="app-panel-strong sticky top-3 h-[calc(100vh-1.5rem)] rounded-[2rem] p-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#edc17a]">Demo Comercial</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Sports AI Monitor</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Ambiente pronto para mostrar disponibilidade do elenco, risco físico, prontidão e impacto prático para clubes pequenos e médios.
        </p>
        <div className="mt-8 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-2xl border px-4 py-3 text-sm transition ${
                  isActive ? "border-white/12 bg-white/[0.09] text-white" : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Pitch</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Com esse sistema você sabe quem está mais pronto, quem está em risco, quem deve ser preservado e como está a disponibilidade do elenco.
          </p>
        </div>
      </aside>

      <main className="page-section min-h-[calc(100vh-1.5rem)] rounded-[2rem] p-6">
        <Outlet />
      </main>
    </div>
  </div>
);
