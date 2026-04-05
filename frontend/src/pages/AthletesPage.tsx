import { useDeferredValue, useState } from "react";
import { Search } from "lucide-react";
import { AthleteTable } from "../components/athletes/AthleteTable";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionCard } from "../components/ui/SectionCard";
import { squadAthletes } from "../mocks/athletesData";

export const AthletesPage = () => {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("Todos");
  const [risk, setRisk] = useState("Todos");
  const [availability, setAvailability] = useState("Todos");
  const deferredSearch = useDeferredValue(search);

  const filteredAthletes = squadAthletes.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(deferredSearch.toLowerCase());
    const matchesPosition = position === "Todos" || athlete.position === position;
    const riskLabel = athlete.riskScore >= 60 ? "Alto risco" : athlete.riskScore >= 35 ? "Risco moderado" : "Baixo risco";
    const matchesRisk = risk === "Todos" || riskLabel === risk;
    const matchesAvailability = availability === "Todos" || athlete.status === availability;

    return matchesSearch && matchesPosition && matchesRisk && matchesAvailability;
  });

  return (
    <PageContainer>
      <div className="space-y-3">
        <p className="text-eyebrow text-[#edc17a]">Squad Monitoring</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Elenco monitorado</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">
          Visão comercialmente forte do plantel com filtros prontos para staff, performance e potenciais clientes.
        </p>
      </div>

      <SectionCard title="Filtros operacionais" subtitle="Encontre rapidamente quem precisa de ação, quem está pronto e quem deve ser preservado.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar atleta"
              className="app-input pl-11"
            />
          </label>
          <select value={position} onChange={(event) => setPosition(event.target.value)} className="app-input">
            <option>Todos</option>
            <option>GK</option>
            <option>RB</option>
            <option>CB</option>
            <option>LB</option>
            <option>DM</option>
            <option>CM</option>
            <option>AM</option>
            <option>RW</option>
            <option>LW</option>
            <option>ST</option>
          </select>
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="app-input">
            <option>Todos</option>
            <option>Baixo risco</option>
            <option>Risco moderado</option>
            <option>Alto risco</option>
          </select>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="app-input">
            <option>Todos</option>
            <option>Disponível</option>
            <option>Gerenciar carga</option>
            <option>Em retorno</option>
            <option>Indisponível</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="Base do elenco"
        subtitle={`${filteredAthletes.length} atletas no recorte atual. Estrutura pronta para trocar os mocks por GET /demo/athletes.`}
      >
        <AthleteTable athletes={filteredAthletes} />
      </SectionCard>
    </PageContainer>
  );
};
