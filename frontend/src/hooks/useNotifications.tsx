import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type NotificationsContextValue = {
  notify: (input: { title: string; description?: string; tone?: ToastTone }) => void;
  notifySuccess: (title: string, description?: string) => void;
  notifyError: (title: string, description?: string) => void;
  notifyInfo: (title: string, description?: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const toneClassName: Record<ToastTone, string> = {
  success: "border-emerald-400/25 bg-emerald-400/12 text-emerald-50",
  error: "border-rose-400/25 bg-rose-400/12 text-rose-50",
  info: "border-sky-400/25 bg-sky-400/12 text-sky-50",
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = (id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const notify = ({ title, description, tone = "info" }: { title: string; description?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, title, description, tone }]);
    window.setTimeout(() => remove(id), 4200);
  };

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notify,
      notifySuccess: (title, description) => notify({ title, description, tone: "success" }),
      notifyError: (title, description) => notify({ title, description, tone: "error" }),
      notifyInfo: (title, description) => notify({ title, description, tone: "info" }),
    }),
    [],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-[1.35rem] border px-4 py-4 shadow-[0_22px_48px_rgba(4,8,15,0.34)] backdrop-blur ${toneClassName[item.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? <p className="mt-1 text-sm opacity-90">{item.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/10"
              >
                Fechar
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
};
