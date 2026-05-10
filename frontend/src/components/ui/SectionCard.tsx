import type { PropsWithChildren, ReactNode } from "react";

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export const SectionCard = ({ title, subtitle, actions, className = "", children }: SectionCardProps) => (
  <section
    className={`app-card relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),linear-gradient(180deg,rgba(14,23,38,0.92),rgba(8,14,24,0.9))] p-5 ${className}`}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[#edc17a]/8 via-transparent to-[#66d184]/8" />
    {(title || subtitle || actions) ? (
      <div className="relative mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {title ? <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3> : null}
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    ) : null}
    <div className="relative">{children}</div>
  </section>
);
