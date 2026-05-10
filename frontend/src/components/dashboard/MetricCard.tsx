import {
  Activity,
  BellRing,
  Gauge,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { DashboardMetricCard as DashboardMetricCardType } from "../../types/dashboard";
import { TrendIndicator } from "./TrendIndicator";

const icons: Record<string, LucideIcon> = {
  Users,
  ShieldAlert,
  Activity,
  Gauge,
  RotateCcw,
  Zap,
  BellRing,
  TrendingUp,
};

const toneClassName = {
  success: "from-emerald-400/16 to-transparent text-emerald-200",
  warning: "from-amber-300/16 to-transparent text-amber-100",
  danger: "from-rose-400/16 to-transparent text-rose-100",
  info: "from-sky-400/16 to-transparent text-sky-100",
  neutral: "from-white/10 to-transparent text-white",
} as const;

export const MetricCard = ({ card }: { card: DashboardMetricCardType }) => {
  const Icon = icons[card.icon] ?? Activity;

  return (
    <article className="app-card app-card-hover relative overflow-hidden rounded-[1.5rem] border border-white/10 p-5">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneClassName[card.tone]}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
          <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{card.value}</p>
          <TrendIndicator value={card.delta} label={card.trendLabel} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="relative mt-5 text-sm leading-6 text-slate-300">{card.helper}</p>
    </article>
  );
};
