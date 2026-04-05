import type { ReactNode } from "react";
import { Button } from "./Button";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export const Dialog = ({ open, title, description, onClose, children }: DialogProps) => {
  if (!open) {
    return null;
  }

  return (
    <div className="app-dialog-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="app-dialog-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="mt-5">
          {children}
        </div>
      </div>
    </div>
  );
};
