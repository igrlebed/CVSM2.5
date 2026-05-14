import { ReactNode, forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Toolbar({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 bg-card/70 backdrop-blur",
        className,
      )}
      style={{ borderBottom: "1px solid var(--border-soft)" }}
    >
      <div className="flex items-center gap-2 min-w-0">{left}</div>
      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </div>
  );
}

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "ghost" | "solid" | "outline";
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton({ children, active, variant = "ghost", className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "ghost" &&
            "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
          variant === "outline" &&
            "bg-card text-foreground border border-[var(--border)] hover:bg-muted",
          variant === "solid" &&
            "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 shadow-sm",
          active && "bg-muted text-foreground border-[var(--border-soft)]",
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
