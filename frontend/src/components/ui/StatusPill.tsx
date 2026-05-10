interface StatusPillProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}

const toneClassName: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  neutral: "border-white/10 bg-white/5 text-slate-200",
};

export const StatusPill = ({ label, tone = "neutral" }: StatusPillProps) => (
  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneClassName[tone]}`}>
    {label}
  </span>
);
