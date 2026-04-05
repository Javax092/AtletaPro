type TeamStrengthComparisonProps = {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
};

const barWidth = (value: number, total: number) => ({
  width: `${Math.max(12, (value / Math.max(total, 1)) * 100)}%`,
});

export const TeamStrengthComparison = ({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: TeamStrengthComparisonProps) => {
  const total = leftValue + rightValue;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{leftLabel}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{leftValue.toFixed(1)}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900/80">
            <div className="h-full rounded-full bg-emerald-400" style={barWidth(leftValue, total)} />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{rightLabel}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{rightValue.toFixed(1)}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-900/80">
            <div className="h-full rounded-full bg-rose-400" style={barWidth(rightValue, total)} />
          </div>
        </div>
      </div>
    </div>
  );
};
