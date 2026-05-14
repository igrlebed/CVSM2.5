import { ReactNode } from "react";
import { cn } from "../lib/cn";
import { StatusBadge } from "./StatusBadge";
import type { CalcStatus } from "../types";

export interface KpiItem {
  label: string;
  value: ReactNode;
  unit?: string;
  status?: CalcStatus;
}

export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2", className)}>
      {items.map((it, i) => (
        <div key={i} className="island px-4 py-3 min-w-0">
          <div
            className="text-[11px] font-medium text-muted-foreground mb-1.5 truncate"
            style={{ letterSpacing: "0.01em" }}
          >
            {it.label}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tabular-nums leading-tight">{it.value}</span>
            {it.unit && <span className="text-xs text-muted-foreground">{it.unit}</span>}
          </div>
          {it.status && (
            <div className="mt-2">
              <StatusBadge status={it.status} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
