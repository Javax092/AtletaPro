import { Link } from "react-router-dom";
import type { SquadAthlete } from "../../types/athlete";
import { RiskBadge } from "../dashboard/RiskBadge";
import { TrendIndicator } from "../dashboard/TrendIndicator";

const riskLabel = (score: number) => (score >= 60 ? "Alto risco" : score >= 35 ? "Risco moderado" : "Baixo risco");

export const AthleteTable = ({ athletes }: { athletes: SquadAthlete[] }) => (
  <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/[0.03]">
          <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <th className="px-5 py-4 font-medium">Atleta</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium">Físico</th>
            <th className="px-5 py-4 font-medium">Risco</th>
            <th className="px-5 py-4 font-medium">Prontidão</th>
            <th className="px-5 py-4 font-medium">Tendência</th>
            <th className="px-5 py-4 font-medium">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6">
          {athletes.map((athlete) => (
            <tr key={athlete.id} className="transition hover:bg-white/[0.03]">
              <td className="px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">{athlete.name}</p>
                  <p className="mt-1 text-xs text-slate-500">#{athlete.number} • {athlete.position}</p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{athlete.status}</td>
              <td className="px-5 py-4 text-sm font-medium text-white">{athlete.physicalScore}</td>
              <td className="px-5 py-4"><RiskBadge label={riskLabel(athlete.riskScore)} /></td>
              <td className="px-5 py-4 text-sm font-medium text-white">{athlete.readinessScore}</td>
              <td className="px-5 py-4"><TrendIndicator value={athlete.trendValue * (athlete.trend === "down" ? -1 : athlete.trend === "stable" ? 0 : 1)} /></td>
              <td className="px-5 py-4">
                <Link to={`/athletes/${athlete.id}`} className="app-button-secondary inline-flex px-4 py-2 text-sm">
                  Ver perfil
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
