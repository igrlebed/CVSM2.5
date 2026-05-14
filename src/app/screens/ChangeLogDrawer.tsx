import { useMemo, useState } from "react";
import {
  Plus,
  Copy as CopyIcon,
  Layers,
  Power,
  Archive,
  ArchiveRestore,
  Share2,
  ListOrdered,
  RefreshCcw,
  Search,
} from "lucide-react";
import { Drawer } from "../overlays/Drawer";
import { ToolbarButton } from "../primitives/Toolbar";
import { EmptyState, ErrorState, LoadingState } from "../primitives/States";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";

type ActionKind =
  | "create"
  | "copy"
  | "composition_change"
  | "project_add"
  | "project_toggle"
  | "archive"
  | "restore"
  | "share_change"
  | "ranking_save";

interface ChangeEntry {
  id: string;
  scenarioId: string;
  author: string;
  timestamp: string;
  action: ActionKind;
  description: string;
}

interface Props {
  scenario: ScenarioSummary | null;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABEL: Record<ActionKind, string> = {
  create: "Создание сценария",
  copy: "Копирование сценария",
  composition_change: "Изменение состава проектов",
  project_add: "Добавление проекта",
  project_toggle: "Включение / выключение проекта",
  archive: "Архивирование",
  restore: "Восстановление из архива",
  share_change: "Изменение прав доступа",
  ranking_save: "Сохранение конфигурации ранжирования",
};

const ACTION_ICON: Record<ActionKind, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  copy: CopyIcon,
  composition_change: Layers,
  project_add: Plus,
  project_toggle: Power,
  archive: Archive,
  restore: ArchiveRestore,
  share_change: Share2,
  ranking_save: ListOrdered,
};

const SEED_BY_SCENARIO: Record<string, ChangeEntry[]> = {
  base: [
    {
      id: "e1",
      scenarioId: "base",
      author: "А. Иванов",
      timestamp: "2026-04-28 14:22",
      action: "ranking_save",
      description: "Сохранена конфигурация ранжирования с пользовательскими весами.",
    },
    {
      id: "e2",
      scenarioId: "base",
      author: "А. Иванов",
      timestamp: "2026-04-15 10:08",
      action: "share_change",
      description: "Открыт доступ для e.sokolova@rzd.ru.",
    },
    {
      id: "e3",
      scenarioId: "base",
      author: "А. Иванов",
      timestamp: "2026-03-22 17:41",
      action: "project_toggle",
      description: "Проект «СМ Москва — Брянск» исключён из состава.",
    },
    {
      id: "e4",
      scenarioId: "base",
      author: "А. Иванов",
      timestamp: "2026-02-03 09:50",
      action: "create",
      description: "Сценарий создан с горизонтом 2025–2050 и 8 системными проектами.",
    },
  ],
  optimistic: [
    {
      id: "e5",
      scenarioId: "optimistic",
      author: "А. Иванов",
      timestamp: "2026-04-29 16:03",
      action: "composition_change",
      description: "Изменён состав проектов: добавлен «ВСМ Москва — Минск».",
    },
    {
      id: "e6",
      scenarioId: "optimistic",
      author: "А. Иванов",
      timestamp: "2026-02-12 11:14",
      action: "copy",
      description: "Сценарий создан копированием из «Базового сценария».",
    },
  ],
  approved: [
    {
      id: "e7",
      scenarioId: "approved",
      author: "Система",
      timestamp: "2026-04-22 03:00",
      action: "composition_change",
      description: "Плановое обновление эталонного состава проектов.",
    },
    {
      id: "e8",
      scenarioId: "approved",
      author: "Система",
      timestamp: "2026-01-15 00:00",
      action: "create",
      description: "Утверждённый сценарий зафиксирован системой.",
    },
  ],
};

type LoadState = "ready" | "loading" | "empty" | "error";

export function ChangeLogDrawer({ scenario, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("ready");

  const entries: ChangeEntry[] = scenario
    ? SEED_BY_SCENARIO[scenario.id] ?? []
    : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return entries;
    return entries.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.author.toLowerCase().includes(q) ||
        ACTION_LABEL[e.action].toLowerCase().includes(q),
    );
  }, [entries, query]);

  return (
    <Drawer
      open={!!scenario}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title="История изменений"
      description="Журнал изменений сценария — только просмотр."
      width="460px"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Только просмотр · {filtered.length} {plural(filtered.length, "запись", "записи", "записей")}
          </span>
          <ToolbarButton variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </ToolbarButton>
        </div>
      }
    >
      {scenario && (
        <div className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--border-soft)] bg-card sticky top-0 z-10">
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-0.5">
              Сценарий
            </div>
            <div className="text-sm font-semibold truncate">{scenario.name}</div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по автору или событию"
                  className="w-full bg-card border border-[var(--border-soft)] rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <ToolbarButton
                variant="outline"
                onClick={() => {
                  setLoadState("loading");
                  setTimeout(() => setLoadState("ready"), 350);
                }}
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </ToolbarButton>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto px-4 py-4">
            {loadState === "loading" && <LoadingState label="Загрузка истории…" />}
            {loadState === "error" && (
              <ErrorState
                message="Не удалось загрузить журнал изменений."
                onRetry={() => setLoadState("ready")}
              />
            )}
            {loadState === "ready" &&
              (filtered.length === 0 ? (
                entries.length === 0 ? (
                  <EmptyState
                    title="История пуста"
                    description="Для этого сценария ещё не зафиксировано изменений."
                  />
                ) : (
                  <EmptyState
                    title="Ничего не найдено"
                    description="Скорректируйте поисковый запрос."
                  />
                )
              ) : (
                <ol className="relative">
                  <span
                    className="absolute left-[15px] top-1 bottom-1 w-px bg-border"
                    aria-hidden
                  />
                  {filtered.map((e) => (
                    <Entry key={e.id} entry={e} />
                  ))}
                </ol>
              ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Entry({ entry }: { entry: ChangeEntry }) {
  const Icon = ACTION_ICON[entry.action];
  return (
    <li className="relative pl-10 pb-4 last:pb-0">
      <span
        className={cn(
          "absolute left-0 top-0 w-8 h-8 rounded-sm border bg-card flex items-center justify-center",
          "border-[var(--border-soft)] text-muted-foreground",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="surface">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[var(--border-soft)]">
          <span className="text-xs font-medium">{ACTION_LABEL[entry.action]}</span>
          <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
            {entry.timestamp}
          </span>
        </div>
        <div className="px-3 py-2 text-xs leading-relaxed text-foreground">
          {entry.description}
        </div>
        <div className="px-3 py-1.5 border-t border-[var(--border-soft)] bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>
            Автор: <span className="text-foreground">{entry.author}</span>
          </span>
          <span className="font-mono uppercase tracking-wide text-[10px]">
            {entry.action}
          </span>
        </div>
      </div>
    </li>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
