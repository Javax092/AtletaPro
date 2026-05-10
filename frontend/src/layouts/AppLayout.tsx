import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { OnboardingChecklist } from "../components/common/OnboardingChecklist";
import { OnboardingTour } from "../components/common/OnboardingTour";
import { Dialog } from "../components/common/Dialog";
import { useNotifications } from "../hooks/useNotifications";
import { useOnboarding } from "../hooks/useOnboarding";
import { useAuth } from "../hooks/useAuth";

const links = [
  { to: "/dashboard", label: "Performance", category: "Performance", description: "Prioridades físicas, alertas e visão diária do elenco" },
  { to: "/athletes", label: "Atletas", category: "Performance", description: "Base do elenco para manter o sistema sempre atualizado" },
  { to: "/alerts", label: "Alertas", category: "Performance", description: "Fila priorizada para ação rápida da comissão e do staff" },
  { to: "/matches", label: "Partidas", category: "Jogo", description: "Cadastro de jogos, vídeos e andamento do material" },
  { to: "/match-intelligence", label: "Match Intelligence", category: "Jogo", description: "Leitura pré-jogo com cenários e probabilidades" },
  { to: "/scout", label: "Scout", category: "Jogo", description: "Análises geradas a partir dos vídeos já processados" },
  { to: "/settings", label: "Configurações", category: "Administração", description: "Ajustes gerais, integrações e perfis de acesso" },
];

export const AppLayout = () => {
  const location = useLocation();
  const { club, user, logout } = useAuth();
  const { openTutorial } = useOnboarding();
  const { notifyInfo } = useNotifications();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = location.pathname;
  const currentLink = links.find((link) => pathname.startsWith(link.to)) ?? links[0];
  const currentCategory = currentLink?.category ?? "Workspace";

  const groupedLinks = links.reduce<Record<string, typeof links>>((accumulator, link) => {
    accumulator[link.category] ??= [];
    accumulator[link.category].push(link);
    return accumulator;
  }, {});

  const breadcrumbs = [
    { label: "Workspace", href: "/dashboard" },
    ...(currentLink ? [{ label: currentLink.category, href: currentLink.to }, { label: currentLink.label, href: currentLink.to }] : []),
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const renderSidebar = (mode: "desktop" | "mobile") => (
    <aside
      className={`app-panel-strong relative overflow-hidden rounded-[2rem] p-5 lg:p-6 ${mode === "desktop" ? "hidden h-[calc(100vh-1.5rem)] lg:block lg:sticky lg:top-3" : "h-full w-full max-w-[340px]"}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-[#edc17a]/18 via-transparent to-[#66d184]/12" />
      <div className="relative flex h-full flex-col">
        <div>
          <div className="flex items-start justify-between gap-3 lg:block">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-[#edc17a]">Sports AI SaaS</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white lg:text-3xl">{club?.name ?? "Clube"}</h2>
              <p className="mt-2 text-sm text-slate-400">{user?.name}</p>
            </div>
            {mode === "mobile" ? (
              <Button variant="secondary" size="sm" onClick={() => setSidebarOpen(false)}>
                Fechar
              </Button>
            ) : null}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Workspace</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Fluxo central para acompanhar elenco, jogos, análises e decisões da comissão.
            </p>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pr-1">
          {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <div key={category}>
              <p className="px-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">{category}</p>
              <div className="mt-3 space-y-2">
                {categoryLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `group block rounded-2xl px-4 py-3.5 text-sm transition ${
                        isActive
                          ? "border border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                          : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{link.label}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{link.description}</p>
                        </div>
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                            isActive ? "bg-[#edc17a]" : "bg-transparent ring-1 ring-white/10 group-hover:bg-white/20"
                          }`}
                        />
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Sessao</p>
          <p className="mt-2 text-sm text-slate-300">Você está na área segura do seu clube.</p>
          <button onClick={() => setLogoutDialogOpen(true)} className="app-button-secondary mt-4 w-full text-sm">
            Sair
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="app-shell min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1520px] gap-3 px-3 py-3 lg:grid-cols-[300px_1fr] lg:gap-5 xl:px-5">
        {renderSidebar("desktop")}

        <main className="relative flex min-h-screen min-w-0 flex-col gap-3 lg:gap-4">
          <header className="app-panel sticky top-3 z-20 overflow-hidden rounded-[1.4rem] px-4 py-4 lg:rounded-[1.75rem] lg:px-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-[#edc17a]/10 via-transparent to-[#66d184]/8" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-3 lg:hidden">
                  <Button variant="secondary" size="sm" onClick={() => setSidebarOpen(true)} leadingIcon="≡">
                    Menu
                  </Button>
                  <div className="truncate text-right">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Clube</p>
                    <p className="truncate text-sm font-medium text-white">{club?.name ?? "Workspace"}</p>
                  </div>
                </div>
                <div className="hidden flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500 sm:flex">
                  {breadcrumbs.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                      {index > 0 ? <span className="text-slate-700">/</span> : null}
                      <span className={index === breadcrumbs.length - 1 ? "text-[#edc17a]" : ""}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">{currentLink.label}</h1>
                    <p className="mt-1 max-w-3xl text-sm text-slate-400">{currentLink.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
                <Button variant="secondary" size="sm" onClick={() => openTutorial(0)}>
                  Ver tutorial
                </Button>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.065]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Contexto</p>
                  <p className="mt-1 text-sm font-medium text-white">{currentCategory}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.065]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Operador</p>
                  <p className="mt-1 text-sm font-medium text-white">{user?.name ?? "Usuario"}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="page-section relative min-h-[calc(100vh-9rem)] min-w-0 overflow-hidden rounded-[1.4rem] lg:rounded-[2rem]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#edc17a]/10 via-transparent to-[#66d184]/8" />
            <div className="relative min-w-0">
              <Outlet />
            </div>
          </section>
          
          <div className="px-2 pb-2 text-center text-[11px] uppercase tracking-[0.22em] text-slate-600">
            Sistema esportivo com navegação centralizada
          </div>
        </main>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 bg-[#04080f]/72 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="h-full p-3" onClick={(event) => event.stopPropagation()}>
            {renderSidebar("mobile")}
          </div>
        </div>
      ) : null}

      <OnboardingChecklist />
      <OnboardingTour />

      <Dialog
        open={logoutDialogOpen}
        title="Encerrar sessão"
        description="Você sairá da área atual do clube."
        onClose={() => setLogoutDialogOpen(false)}
      >
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-300">
            Confirme o encerramento da sessão atual para voltar à tela de acesso.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setLogoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                logout();
                setLogoutDialogOpen(false);
                notifyInfo("Sessão encerrada", "Seu acesso foi encerrado com segurança.");
              }}
            >
              Sair do sistema
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
