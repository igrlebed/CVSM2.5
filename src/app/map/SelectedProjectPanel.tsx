import { ArrowUpRight, X } from "lucide-react";
import { TYPE_COLOR, STATUS_LABEL, type ProjectGeo } from "./projectsData";
import { cn } from "../lib/cn";

interface Props {
  project: ProjectGeo;
  onClose: () => void;
  onOpenCard: () => void;
}

const SYSTEM_IDS = new Set([
  "msk-spb",
  "msk-ekb",
  "msk-adler",
  "msk-minsk",
  "msk-ryazan",
  "msk-belgorod",
  "msk-bryansk",
  "msk-yaroslavl",
]);

export function SelectedProjectPanel({ project, onClose, onOpenCard }: Props) {
  const isSystemOrigin = SYSTEM_IDS.has(project.id);
  const originLabel = isSystemOrigin ? "Утверждённый" : "Добавленный";

  return (
    <aside
      className="w-[360px] shrink-0 bg-card flex flex-col h-full"
      style={{ boxShadow: "-2px 0 12px rgba(14,21,35,0.07)" }}
      aria-label="Сводка выбранного проекта"
    >
      <header
        className="flex items-start justify-between gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
            Выбранный проект
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: TYPE_COLOR[project.type] }}
            />
            <h2 className="text-sm font-semibold leading-snug truncate">
              {project.name}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть панель"
          title="Закрыть"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        <dl className="border-b border-[var(--border-soft)] divide-y divide-[var(--border-soft)] text-xs">
          <Row label="Тип проекта">
            <span
              className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[11px] font-medium"
            >
              <span
                aria-hidden
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TYPE_COLOR[project.type] }}
              />
              {project.type}
            </span>
          </Row>
          <Row label="Статус происхождения">
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide",
                isSystemOrigin
                  ? "bg-primary/5 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-[var(--border-soft)]",
              )}
            >
              {originLabel}
            </span>
          </Row>
          <Row label="Статус реализации">
            <span className="inline-flex items-center px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[10px] font-medium uppercase tracking-wide bg-muted text-foreground/80">
              {STATUS_LABEL[project.realStatus]}
            </span>
          </Row>
          <Row label="Откуда">
            <span className="font-medium">{project.from}</span>
          </Row>
          <Row label="Куда">
            <span className="font-medium">{project.to}</span>
          </Row>
          <Row label="Протяжённость">
            <span className="font-mono tabular-nums">
              {project.lengthKm.toLocaleString("ru-RU")}{" "}
              <span className="text-muted-foreground">км</span>
            </span>
          </Row>
          <Row label="Год запуска">
            <span className="font-mono tabular-nums">{project.commissionYear}</span>
          </Row>
        </dl>

        <div className="px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
          Сводка предоставляется в режиме только для просмотра. Полный набор атрибутов проекта — в карточке.
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-[var(--border-soft)] shrink-0">
        <button
          onClick={onOpenCard}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Открыть карточку проекта
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right min-w-0 truncate">{children}</dd>
    </div>
  );
}