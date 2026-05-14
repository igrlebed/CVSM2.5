import { ArrowUpRight, GitCompareArrows, X, AlertTriangle } from "lucide-react";
import {
  PROJECTS,
  TYPE_COLOR,
  STATUS_LABEL,
  type ProjectGeo,
} from "./projectsData";
import { cn } from "../lib/cn";

interface Props {
  ids: string[];
  year: number;
  evictedNames: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
  onOpenCompare: () => void;
  onDismissEvicted: () => void;
}

export function CompareBasketPanel({
  ids,
  year,
  evictedNames,
  onRemove,
  onClear,
  onClose,
  onOpenCompare,
  onDismissEvicted,
}: Props) {
  const items = ids
    .map((id) => PROJECTS.find((p) => p.id === id))
    .filter((p): p is ProjectGeo => Boolean(p));
  const count = items.length;
  const canCompare = count >= 2;

  return (
    <aside
      className="w-[360px] shrink-0 bg-card flex flex-col h-full"
      style={{ boxShadow: "-2px 0 12px rgba(14,21,35,0.07)" }}
      aria-label="Набор для сравнения"
    >
      <header
        className="flex items-start justify-between gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
            Режим сравнения
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <GitCompareArrows className="w-4 h-4 text-foreground shrink-0" />
            <h2 className="text-sm font-semibold leading-snug">
              Набор для сравнения
            </h2>
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[10px] font-mono tabular-nums text-muted-foreground">
              {count}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Выйти из режима сравнения"
          title="Выйти из режима сравнения"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      {evictedNames.length > 0 && (
        <div className="border-b border-[var(--status-pending)]/30 bg-[var(--status-pending)]/10 px-4 py-2 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-pending)] mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-foreground/90">
              Удалено из набора ({evictedNames.length}): не ��ходит в срез ≤{" "}
              <span className="font-mono tabular-nums">{year}</span>.
            </div>
            <div className="mt-0.5 text-muted-foreground truncate">
              {evictedNames.join(", ")}
            </div>
          </div>
          <button
            onClick={onDismissEvicted}
            aria-label="Скрыть уведомление"
            className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Кликните по маршруту на карте, чтобы добавить проект в набор.
              Минимум 2 проекта для перехода в модуль «Сравнение».
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-soft)]">
            {items.map((p, i) => (
              <li
                key={p.id}
                className="flex items-start gap-2.5 px-4 py-2.5"
              >
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground mt-0.5 w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: TYPE_COLOR[p.type] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium leading-snug truncate">
                    {p.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] font-mono text-muted-foreground tabular-nums">
                    <span>{p.commissionYear}</span>
                    <span>·</span>
                    <span>{p.lengthKm.toLocaleString("ru-RU")} км</span>
                    <span>·</span>
                    <span className="uppercase tracking-wide">
                      {STATUS_LABEL[p.realStatus]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(p.id)}
                  aria-label={`Убрать ${p.name} из набора`}
                  title="Убрать из набора"
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-[var(--border-soft)] px-4 py-3 shrink-0 space-y-2">
        <button
          onClick={onOpenCompare}
          disabled={!canCompare}
          className={cn(
            "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors",
            canCompare
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
          title={
            canCompare
              ? undefined
              : "Добавьте минимум 2 проекта для сравнения"
          }
        >
          Открыть сравнение
          <span className="font-mono tabular-nums">({count})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center justify-between text-[11px]">
          <button
            onClick={onClear}
            disabled={count === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Очистить набор
          </button>
          <span className="font-mono tabular-nums text-muted-foreground">
Сессионный набор
          </span>
        </div>
      </footer>
    </aside>
  );
}