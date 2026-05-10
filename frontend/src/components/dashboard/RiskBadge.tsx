import { CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";

interface RiskBadgeProps {
  label: string;
}

export const RiskBadge = ({ label }: RiskBadgeProps) => {
  const normalized = label.toLowerCase();
  const tone =
    normalized.includes("alto")
      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
      : normalized.includes("moderado")
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
  const Icon =
    normalized.includes("alto") ? ShieldAlert : normalized.includes("moderado") ? CircleHelp : ShieldCheck;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};
