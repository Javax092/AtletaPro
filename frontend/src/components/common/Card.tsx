import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const Card = ({ title, subtitle, actions, children, className = "", ...props }: CardProps) => (
  <section className={`page-section ${className}`.trim()} {...props}>
    {title || subtitle || actions ? (
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
    ) : null}
    {children}
  </section>
);
