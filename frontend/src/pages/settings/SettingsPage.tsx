import { StatCard } from "../../components/common/StatCard";
import { PageHeader } from "../../components/common/PageHeader";

export const SettingsPage = () => (
  <div className="space-y-6">
    <PageHeader title="Configurações" subtitle="Organize perfis, integrações e ajustes gerais do clube." />
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard label="Estrutura do clube" value="Organizada" helper="Cada clube opera em sua própria área." accentClassName="from-grass/30" />
      <StatCard label="Integrações" value="Preparado" helper="Espaço pronto para conectar novas fontes de dados." accentClassName="from-sky-400/30" />
      <StatCard label="Perfis de acesso" value="Em evolução" helper="Área reservada para definir quem pode ver e editar cada parte do sistema." accentClassName="from-amber-300/30" />
    </section>

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="page-section rounded-[1.6rem]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#edc17a]">Estrutura atual</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Base pronta para crescer com segurança</h2>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          A estrutura atual já separa os dados de cada clube e permite evoluir perfis, integrações e preferências sem mudar o uso diário do sistema.
        </p>
      </section>

      <section className="page-section rounded-[1.6rem]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Próximos ajustes</p>
        <div className="mt-4 grid gap-3">
          {[
            "Perfis de acesso para staff, análise e comissão técnica.",
            "Preferências de coleta de dados e importação.",
            "Conexões com fontes externas e recursos inteligentes.",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
