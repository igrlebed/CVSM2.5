import type { CalcStatus } from "../types";
import { cn } from "../lib/cn";

const LABEL: Record<CalcStatus, string> = {
  not_calculated: "не рассчитано",
  in_calculation: "в расчёте",
  actual: "актуально",
  stale_after_changes: "устарело",
  calculation_error: "ошибка расчёта",
};

/* Dot color — no border, background pill stripped to dot + text */
const DOT_COLOR: Record<CalcStatus, string> = {
  not_calculated:     "bg-[var(--status-not-calc)]",
  in_calculation:     "bg-[var(--status-pending)]",
  actual:             "bg-[var(--status-actual)]",
  stale_after_changes:"bg-[var(--status-stale)]",
  calculation_error:  "bg-[var(--status-error)]",
};

const TEXT_COLOR: Record<CalcStatus, string> = {
  not_calculated:     "text-[var(--status-not-calc)]",
  in_calculation:     "text-[var(--status-pending)]",
  actual:             "text-[var(--status-actual)]",
  stale_after_changes:"text-[var(--status-stale)]",
  calculation_error:  "text-[var(--status-error)]",
};

const BG_TONE: Record<CalcStatus, string> = {
  not_calculated:     "bg-muted",
  in_calculation:     "bg-[var(--status-pending)]/10",
  actual:             "bg-[var(--status-actual)]/10",
  stale_after_changes:"bg-[var(--status-stale)]/10",
  calculation_error:  "bg-[var(--status-error)]/10",
};

export function StatusBadge({
  status,
  className,
  compact = false,
}: {
  status: CalcStatus;
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span
        title={LABEL[status]}
        aria-label={LABEL[status]}
        className={cn(
          "inline-flex items-center justify-center w-2 h-2 rounded-full",
          DOT_COLOR[status],
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium",
        BG_TONE[status],
        TEXT_COLOR[status],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_COLOR[status])} />
      {LABEL[status]}
    </span>
  );
}