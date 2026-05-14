import { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Обёртка для всех графиков на Chart.js.
 *
 * Ответственность:
 *  - заголовок графика
 *  - легенда и оси (когда применимо)
 *  - состояния loading / empty / error
 *  - неинвазивный контейнер вокруг канвы Chart.js
 */
interface Props {
  title: string;
  description?: string;
  state?: "loading" | "empty" | "error" | "ready";
  height?: number;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartFrame({
  title,
  description,
  state = "ready",
  height = 240,
  children,
  actions,
  className,
}: Props) {
  return (
    <div className={cn("border border-[var(--border-soft)] rounded-md bg-card", className)}>
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border-soft)]">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            График
          </div>
          <div className="text-sm font-medium truncate">{title}</div>
          {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>
      <div className="p-4" style={{ minHeight: height }}>
        {state === "loading" && (
          <div className="h-full flex items-center justify-center text-xs uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Загрузка…
          </div>
        )}
        {state === "empty" && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Нет данных для отображения.
          </div>
        )}
        {state === "error" && (
          <div className="h-full flex items-center justify-center text-xs text-[var(--status-error)]">
            Не удалось построить график.
          </div>
        )}
        {state === "ready" && children}
      </div>
    </div>
  );
}
