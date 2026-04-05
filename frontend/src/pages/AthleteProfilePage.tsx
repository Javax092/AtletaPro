import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AthleteProfileHeader } from "../components/athletes/AthleteProfileHeader";
import { AthleteStatCard } from "../components/athletes/AthleteStatCard";
import { AthleteTrendChart } from "../components/athletes/AthleteTrendChart";
import { RiskBadge } from "../components/dashboard/RiskBadge";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionCard } from "../components/ui/SectionCard";
import { athleteProfiles } from "../mocks/athletesData";
import { squadAlerts } from "../mocks/alertsData";

export const AthleteProfilePage = () => {
  const { athleteId = "" } = useParams();
  const profile = useMemo(() => athleteProfiles.find((item) => item.athlete.id === athleteId) ?? athleteProfiles[0], [athleteId]);
  const athleteAlerts = squadAlerts.filter((alert) => alert.athleteId === profile.athlete.id);

  return (
    <PageContainer>
      <AthleteProfileHeader athlete={profile.athlete} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AthleteStatCard label="Score físico" value={String(profile.athlete.physicalScore)} helper="Condição global para suportar o plano competitivo." />
        <AthleteStatCard label="Score técnico" value={String(profile.athlete.technicalScore)} helper="Impacto técnico estimado no contexto atual." />
        <AthleteStatCard label="Score de risco" value={String(profile.athlete.riskScore)} helper="Risco consolidado a partir da janela recente." />
        <AthleteStatCard label="Disponibilidade" value={String(profile.athlete.availabilityScore)} helper="Probabilidade de sustentar participação útil." />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AthleteTrendChart athlete={profile.athlete} dataKey="load" title="Evolução da carga" subtitle="Carga consolidada do atleta no recorte recente." color="#edc17a" formatter={(value) => `${value} AU`} />
        <AthleteTrendChart athlete={profile.athlete} dataKey="risk" title="Evolução do risco" subtitle="Tendência probabilística de risco competitivo." color="#ff7d7d" formatter={(value) => `${Math.round(value * 100)}%`} />
        <AthleteTrendChart athlete={profile.athlete} dataKey="recovery" title="Evolução da recuperação" subtitle="Prontidão de recuperação para o próximo estímulo." color="#66d184" formatter={(value) => `${value}`} />
        <AthleteTrendChart athlete={profile.athlete} dataKey="intensity" title="Intensidade recente" subtitle="Nível de exigência física nas sessões mais recentes." color="#6eb8ff" formatter={(value) => `${value}`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Resumo automático" subtitle="Leitura pronta para staff, direção e apresentação comercial.">
          <p className="text-sm leading-8 text-slate-200">{profile.automaticSummary}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <RiskBadge label={profile.athlete.riskScore >= 60 ? "Alto risco" : profile.athlete.riskScore >= 35 ? "Risco moderado" : "Baixo risco"} />
          </div>
        </SectionCard>

        <SectionCard title="Recomendação objetiva" subtitle="Orientação executiva para comissão técnica.">
          <p className="text-sm leading-8 text-slate-200">{profile.recommendation}</p>
        </SectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Histórico recente" subtitle="Linha do tempo operacional do atleta.">
          <div className="space-y-3">
            {profile.recentHistory.map((item) => (
              <div key={`${item.date}-${item.sessionType}`} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{item.sessionType}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.date}</p>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Carga {item.workload} AU • Fadiga {item.fatigue} • Recuperação {item.recovery}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alertas relacionados e observações" subtitle="Tudo o que a comissão precisa ler sem abrir outras telas.">
          <div className="space-y-4">
            <div className="space-y-3">
              {athleteAlerts.length > 0 ? athleteAlerts.map((alert) => (
                <div key={alert.id} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">{alert.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{alert.reason}</p>
                </div>
              )) : <p className="text-sm text-slate-400">Sem alertas críticos recentes para este atleta.</p>}
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Observações automáticas</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300">
                {profile.observations.map((observation) => (
                  <li key={observation}>{observation}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </section>
    </PageContainer>
  );
};
