import { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  className?: string;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyState,
  className,
  dense,
}: Props<T>) {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={cn("surface overflow-hidden", className)}>
      <div className="overflow-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width, borderBottom: "1px solid var(--border-soft)" }}
                  className={cn(
                    "text-left text-[11px] font-medium text-muted-foreground px-3 py-2.5",
                    "bg-[var(--surface-raised)] first:rounded-tl-[inherit]",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/40",
                  idx % 2 === 0 ? "bg-card" : "bg-[var(--surface-raised)]",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      borderBottom:
                        idx < rows.length - 1 ? "1px solid var(--border-soft)" : undefined,
                    }}
                    className={cn(
                      "px-3 align-middle",
                      dense ? "py-1.5" : "py-2.5",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
