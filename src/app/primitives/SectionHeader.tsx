import { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  eyebrow?: string;
}

export function SectionHeader({ title, subtitle, actions, className, eyebrow }: Props) {
  return (
    <div className={cn("flex items-end justify-between gap-4 pb-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="mb-1 text-[11px] font-medium text-muted-foreground"
            style={{ letterSpacing: "0.01em" }}
          >
            {eyebrow}
          </div>
        )}
        <h2 className="text-base font-semibold text-foreground truncate" style={{ fontSize: "var(--text-base)" }}>
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
