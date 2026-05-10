import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  label?: string;
}

export const TrendIndicator = ({ value, label }: TrendIndicatorProps) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClassName = isNeutral ? "text-slate-400" : isPositive ? "text-emerald-300" : "text-rose-300";

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorClassName}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{isPositive ? "+" : ""}{value.toFixed(1)}%</span>
      {label ? <span className="text-slate-500">{label}</span> : null}
    </div>
  );
};
