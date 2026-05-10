interface AthleteStatCardProps {
  label: string;
  value: string;
  helper: string;
}

export const AthleteStatCard = ({ label, value, helper }: AthleteStatCardProps) => (
  <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5">
    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    <p className="mt-2 text-sm leading-6 text-slate-400">{helper}</p>
  </div>
);
