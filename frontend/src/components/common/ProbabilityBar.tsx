type ProbabilityBarProps = {
  homeLabel: string;
  awayLabel: string;
  homeValue: number;
  drawValue: number;
  awayValue: number;
};

const segmentStyle = (value: number) => ({
  width: `${Math.max(value, 0)}%`,
});

export const ProbabilityBar = ({ homeLabel, awayLabel, homeValue, drawValue, awayValue }: ProbabilityBarProps) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
      <span>{homeLabel}</span>
      <span>Empate</span>
      <span>{awayLabel}</span>
    </div>
    <div className="flex h-4 overflow-hidden rounded-full bg-slate-900/80">
      <div className="bg-emerald-400" style={segmentStyle(homeValue)} />
      <div className="bg-amber-300" style={segmentStyle(drawValue)} />
      <div className="bg-rose-400" style={segmentStyle(awayValue)} />
    </div>
    <div className="mt-3 grid gap-3 text-sm text-slate-200 md:grid-cols-3">
      <div className="rounded-xl bg-slate-950/60 px-3 py-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{homeLabel}</p>
        <p className="mt-1 text-xl font-semibold">{homeValue.toFixed(1)}%</p>
      </div>
      <div className="rounded-xl bg-slate-950/60 px-3 py-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Empate</p>
        <p className="mt-1 text-xl font-semibold">{drawValue.toFixed(1)}%</p>
      </div>
      <div className="rounded-xl bg-slate-950/60 px-3 py-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{awayLabel}</p>
        <p className="mt-1 text-xl font-semibold">{awayValue.toFixed(1)}%</p>
      </div>
    </div>
  </div>
);
