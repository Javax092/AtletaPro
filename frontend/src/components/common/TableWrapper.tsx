import type { ReactNode } from "react";

type TableWrapperProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export const TableWrapper = ({ children, title, description, actions }: TableWrapperProps) => (
  <div className="space-y-4">
    {title || description || actions ? (
      <div className="flex items-start justify-between gap-4">
        <div>
          {title ? <h3 className="text-base font-semibold text-white">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
        {actions}
      </div>
    ) : null}
    <div className="app-table-shell">
      {children}
    </div>
  </div>
);
