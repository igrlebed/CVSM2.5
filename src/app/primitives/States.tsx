import { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import { cn } from "../lib/cn";

export function LoadingState({
  label = "Загрузка…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <div
        className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Inbox className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description && (
          <div className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  message = "Не удалось загрузить данные.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--status-error)]/10 flex items-center justify-center">
        <AlertTriangle className="w-4 h-4 text-[var(--status-error)]" />
      </div>
      <div className="text-sm text-foreground">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1.5 bg-card rounded-md border border-[var(--border)] hover:bg-muted transition-all"
        >
          Повторить попытку
        </button>
      )}
    </div>
  );
}

export function PlaceholderBlock({
  title,
  note = "Модуль находится в разработке. Доступен только структурный каркас.",
  className,
}: {
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("island p-6", className)}
      style={{ border: "1px dashed var(--border)" }}
    >
      <div className="flex items-start gap-4">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-1">Заглушка</div>
          <div className="text-sm font-medium">{title}</div>
          <p className="mt-2 text-xs text-muted-foreground max-w-md">{note}</p>
        </div>
      </div>
    </div>
  );
}
