type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  accentClassName?: string;
  isLoading?: boolean;
};

export const StatCard = ({ label, value, helper, accentClassName = "from-grass/20", isLoading = false }: StatCardProps) => (
  <div className="app-card app-card-hover relative overflow-hidden rounded-[1.5rem] p-5">
    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentClassName} via-white/20 to-transparent`} />
    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.03]" />
    <p className="text-label-muted">{label}</p>
    <p className="text-metric-emphasis mt-4 text-2xl sm:text-3xl">{isLoading ? "..." : value}</p>
    {helper ? <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">{helper}</p> : null}
  </div>
);
