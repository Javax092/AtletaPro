import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-sm text-slate-300">
      •
    </div>
    <p className="text-base font-medium text-white">{title}</p>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-400">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
