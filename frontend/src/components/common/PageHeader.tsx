import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export const PageHeader = ({
  title,
  subtitle,
  eyebrow = "Workspace",
  badge,
  actions,
}: PageHeaderProps) => (
  <div className="mb-8 flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p className="text-label-muted tone-warning">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2.6rem]">{title}</h1>
      <p className="app-muted-copy mt-3 max-w-3xl text-sm leading-7">{subtitle}</p>
    </div>
    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
      {actions}
      {badge ?? (
        <div className="app-card rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.22em] text-slate-500">
          Operacao Premium
        </div>
      )}
    </div>
  </div>
);
