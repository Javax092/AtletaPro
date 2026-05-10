import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { demoApi } from "../../api/demo";
import { Badge } from "../../components/common/Badge";
import { Card } from "../../components/common/Card";
import { LoadingState } from "../../components/common/LoadingState";
import { PageHeader } from "../../components/common/PageHeader";

export const DemoAthletesPage = () => {
  const [athletes, setAthletes] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void demoApi.athletes().then(setAthletes);
  }, []);

  if (athletes.length === 0) {
    return <LoadingState lines={5} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Atletas" subtitle="Base demo com perfis, risco, disponibilidade e narrativa pronta para apresentação comercial." eyebrow="Elenco monitorado" />

      <Card title="Elenco pronto para venda" subtitle="Use esta tela para mostrar coerência do dado, segmentação por posição e leitura prática por atleta.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {athletes.map((athlete) => (
            <Link key={String(athlete.id)} to={`/demo/athletes/${String(athlete.id)}`} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.07]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{String(athlete.full_name)}</p>
                  <p className="mt-1 text-sm text-slate-400">{String(athlete.position)}</p>
                </div>
                <Badge tone={String(athlete.risk_level) === "HIGH" ? "danger" : String(athlete.risk_level) === "MEDIUM" ? "warning" : "success"}>
                  {String(athlete.risk_level ?? "LOW")}
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Físico</p>
                  <p className="mt-2 text-sm font-semibold text-white">{Number(athlete.physical_score ?? 0).toFixed(0)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Disponível</p>
                  <p className="mt-2 text-sm font-semibold text-white">{Number(athlete.availability_score ?? 0).toFixed(0)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Prontidão</p>
                  <p className="mt-2 text-sm font-semibold text-white">{Number(athlete.readiness_score ?? 0).toFixed(0)}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{String(athlete.summary ?? "")}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};
