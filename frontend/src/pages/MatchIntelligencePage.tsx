import { Link } from "react-router-dom";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionCard } from "../components/ui/SectionCard";
import { matchIntelligenceReport } from "../mocks/matchIntelligenceData";
import { RiskBadge } from "../components/dashboard/RiskBadge";
import { squadAthletes } from "../mocks/athletesData";
import type { MatchSelectionItem } from "../types/match";

export const MatchIntelligencePage = () => {
  const lineupShape = ["GK", "RB", "CB", "CB", "LB", "DM", "CM", "AM", "RW", "LW", "ST"];
  const lineup = lineupShape
    .map((position) => matchIntelligenceReport.idealLineup.find((player) => player.position === position))
    .filter((player): player is MatchSelectionItem => Boolean(player));

  const preserveSummary = matchIntelligenceReport.preservePlayers.map((player) => player.athleteName).join(", ");
  const availableRate = Math.round((squadAthletes.filter((athlete) => athlete.status === "Disponível").length / squadAthletes.length) * 100);

  return (
    <PageContainer>
      <div className="space-y-3">
        <p className="text-eyebrow text-[#edc17a]">Match Intelligence</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">{matchIntelligenceReport.matchTitle}</h1>
        <p className="max-w-4xl text-sm leading-7 text-slate-300">
          Centro de decisão para comissão técnica com escalação ideal, banco sugerido, atletas a preservar e narrativa tática pronta para reunião pré-jogo.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Adversário</p>
          <p className="mt-3 text-2xl font-semibold text-white">{matchIntelligenceReport.opponent}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Competição</p>
          <p className="mt-3 text-2xl font-semibold text-white">{matchIntelligenceReport.competition}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Disponibilidade</p>
          <p className="mt-3 text-2xl font-semibold text-white">{availableRate}%</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">A preservar</p>
          <p className="mt-3 text-2xl font-semibold text-white">{matchIntelligenceReport.preservePlayers.length}</p>
        </div>
      </section>

      <SectionCard title="Recomendação tática geral" subtitle="Leitura executiva para orientar a semana e a conversa final pré-jogo.">
        <p className="text-sm leading-8 text-slate-200">{matchIntelligenceReport.tacticalRecommendation}</p>
      </SectionCard>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Escalação ideal" subtitle="11 inicial sugerido com justificativas orientadas por prontidão e risco.">
          <div className="grid gap-3">
            {lineup.map((player) => (
              <div key={player.athleteId} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{player.athleteName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{player.position} • prontidão {player.readinessScore}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{player.justification}</p>
                  </div>
                  <RiskBadge label={player.riskLabel} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title="Banco sugerido" subtitle="Cobertura por setor com perfil competitivo atual.">
            <div className="space-y-3">
              {matchIntelligenceReport.suggestedBench.map((player) => (
                <div key={player.athleteId} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{player.athleteName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{player.position} • prontidão {player.readinessScore}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Atletas a preservar" subtitle="Casos que pedem controle direto de uso.">
            <p className="mb-4 text-sm leading-7 text-slate-300">{preserveSummary}.</p>
            <div className="space-y-3">
              {matchIntelligenceReport.preservePlayers.map((player) => (
                <div key={player.athleteId} className="rounded-[1.35rem] border border-amber-300/15 bg-amber-300/10 p-4">
                  <p className="text-sm font-semibold text-white">{player.athleteName}</p>
                  <p className="mt-2 text-sm leading-7 text-amber-50">{player.justification}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Jogadores sob observação" subtitle="Peças úteis com leitura mais contextual.">
          <div className="space-y-3">
            {matchIntelligenceReport.watchlistPlayers.map((player) => (
              <Link key={player.athleteId} to={`/athletes/${player.athleteId}`} className="block rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07]">
                <p className="text-sm font-semibold text-white">{player.athleteName}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{player.justification}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Indisponíveis" subtitle="Casos fora da estratégia da rodada.">
          <div className="space-y-3">
            {matchIntelligenceReport.unavailablePlayers.map((player) => (
              <div key={player.athleteId} className="rounded-[1.35rem] border border-rose-400/15 bg-rose-400/10 p-4">
                <p className="text-sm font-semibold text-white">{player.athleteName}</p>
                <p className="mt-2 text-sm leading-7 text-rose-100">{player.justification}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Justificativas e recomendação tática" subtitle="Fala executiva pronta para staff e apresentação comercial.">
        <ul className="space-y-3 text-sm leading-7 text-slate-200">
          {matchIntelligenceReport.tacticalNotes.map((note) => (
            <li key={note} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              {note}
            </li>
          ))}
        </ul>
      </SectionCard>
    </PageContainer>
  );
};
