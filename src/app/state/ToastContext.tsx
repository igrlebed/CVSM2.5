import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "../lib/cn";

type ToastTone = "info" | "success" | "warning" | "error";

interface ToastInput {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface Toast extends Required<Omit<ToastInput, "title">> {
  id: number;
  title?: string;
}

interface ToastContextValue {
  show: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = ++idRef.current;
      const toast: Toast = {
        id,
        title: input.title,
        message: input.message,
        tone: input.tone ?? "info",
        durationMs: input.durationMs ?? 4000,
      };
      setToasts((prev) => [...prev, toast]);
      if (toast.durationMs > 0) {
        window.setTimeout(() => dismiss(id), toast.durationMs);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Уведомления"
      className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.tone === "success"
      ? Check
      : toast.tone === "warning"
        ? AlertTriangle
        : toast.tone === "error"
          ? AlertTriangle
          : Info;
  const accent =
    toast.tone === "success"
      ? "text-[var(--status-actual)]"
      : toast.tone === "warning"
        ? "text-[var(--status-stale)]"
        : toast.tone === "error"
          ? "text-[var(--status-error)]"
          : "text-muted-foreground";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-2 px-3 py-2 border border-[var(--border-soft)] bg-card rounded-sm shadow-lg text-xs",
      )}
    >
      <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", accent)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-0.5">
            {toast.title}
          </div>
        )}
        <div className="leading-snug">{toast.message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Скрыть уведомление"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
