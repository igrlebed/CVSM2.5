import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Lock,
  FolderOpen,
  Copy,
  Share2,
  Archive,
  ArchiveRestore,
  Trash2,
  History,
  Info,
  RefreshCcw,
  AlertTriangle,
  GitCompareArrows,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { DataTable, type Column } from "../primitives/DataTable";
import { EmptyState, ErrorState, LoadingState } from "../primitives/States";
import { ToolbarButton } from "../primitives/Toolbar";
import { StatusBadge } from "../primitives/StatusBadge";
import { Modal } from "../overlays/Modal";
import { CreateScenarioModal } from "./CreateScenarioModal";
import { CopyScenarioDialog } from "./CopyScenarioDialog";
import { ScenarioInfoDrawer } from "./ScenarioInfoDrawer";
import { ShareScenarioModal } from "./ShareScenarioModal";
import { ChangeLogDrawer } from "./ChangeLogDrawer";
import { useScenario } from "../state/ScenarioContext";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";
import { getScenarioCompareGate } from "../lib/scenarioCompare";

type Tab = "active" | "archive";
type TypeFilter = "all" | "system" | "user";
type LoadState = "ready" | "loading" | "empty" | "error";

const TYPE_LABEL: Record<TypeFilter, string> = {
  all: "Все типы",
  system: "Системные",
  user: "Пользовательские",
};

export function RegistryScreen() {
  const navigate = useNavigate();
  const {
    scenarios,
    setActiveScenario,
    archiveScenario,
    restoreScenario,
    deleteScenario,
  } = useScenario();

  const [tab, setTab] = useState<Tab>("active");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [confirmDelete, setConfirmDelete] = useState<ScenarioSummary | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [copySource, setCopySource] = useState<ScenarioSummary | null>(null);
  const [infoTarget, setInfoTarget] = useState<ScenarioSummary | null>(null);
  const [shareTarget, setShareTarget] = useState<ScenarioSummary | null>(null);
  const [changeLogTarget, setChangeLogTarget] = useState<ScenarioSummary | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [baselineTargetId, setBaselineTargetId] = useState<string | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [staleConfirmed, setStaleConfirmed] = useState(false);

  const filtered = useMemo(() => {
    if (loadState !== "ready") return [];
    const q = query.trim().toLowerCase();
    return scenarios
      .filter((s) => (tab === "active" ? !s.archived : !!s.archived))
      .filter((s) => (typeFilter === "all" ? true : s.type === typeFilter))
      .filter((s) =>
        q.length === 0
          ? true
          : s.name.toLowerCase().includes(q) || s.author.toLowerCase().includes(q),
      );
  }, [scenarios, tab, query, typeFilter, loadState]);

  const handleOpen = (s: ScenarioSummary) => {
    setActiveScenario(s.id);
    navigate("/map");
  };

  const isArchive = tab === "archive";
  const selectedScenarios = selectedIds
    .map((id) => scenarios.find((scenario) => scenario.id === id))
    .filter((scenario): scenario is ScenarioSummary => Boolean(scenario));

  useEffect(() => {
    if (isArchive) {
      setSelectMode(false);
      setSelectedIds([]);
    }
  }, [isArchive]);

  useEffect(() => {
    if (!selectMode) {
      setSelectedIds([]);
      setBaselineTargetId(null);
      setCompareDialogOpen(false);
      setStaleConfirmed(false);
    }
  }, [selectMode]);

  // Archive tab forces type filter to "user" (system scenarios cannot be archived)
  const effectiveTypeFilter: TypeFilter = isArchive ? "user" : typeFilter;

  const columns: Column<ScenarioSummary>[] = useMemo(() => {
    const base: Column<ScenarioSummary>[] = [];

    if (!isArchive && selectMode) {
      base.push({
        key: "select",
        header: "",
        width: "44px",
        align: "center",
        render: (row) => {
          const gate = getScenarioCompareGate(row);
          const selected = selectedIds.includes(row.id);
          const maxReached = selectedIds.length >= 4 && !selected;
          const disabled = !gate.selectable || maxReached;
          const title = !gate.selectable
            ? gate.blockingReason
            : maxReached
              ? "Можно сопоставить не более 4 сценариев."
              : `Выбрать сценарий «${row.name}»`;
          return (
            <input
              type="checkbox"
              checked={selected}
              disabled={disabled}
              title={title}
              aria-label={title}
              onClick={(event) => event.stopPropagation()}
              onChange={() => {
                setSelectedIds((prev) => {
                  if (prev.includes(row.id)) return prev.filter((id) => id !== row.id);
                  if (prev.length >= 4) return prev;
                  return [...prev, row.id];
                });
              }}
            />
          );
        },
      });
    }

    base.push(
      {
        key: "n",
        header: "№",
        width: "48px",
        align: "right",
        render: (r) => (
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {scenarios.indexOf(r) + 1}
          </span>
        ),
      },
      {
        key: "name",
        header: "Наименование",
        render: (r) => (
          <div className="flex items-center gap-2 min-w-0">
            {r.type === "system" && (
              <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="truncate font-medium">{r.name}</span>
          </div>
        ),
      },
      {
        key: "type",
        header: "Тип",
        width: "150px",
        render: (r) => <TypeBadge type={r.type} />,
      },
      {
        key: "count",
        header: "Кол-во проектов",
        width: "140px",
        align: "right",
        render: (r) => <span className="tabular-nums">{r.projectCount}</span>,
      },
      {
        key: "calc",
        header: "Статус данных",
        width: "210px",
        render: (r) => <StatusBadge status={r.calcStatus} />,
      },
    );

    if (isArchive) {
      base.push(
        {
          key: "archivedAt",
          header: "Дата архивации",
          width: "140px",
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {r.archivedAt ?? "—"}
            </span>
          ),
        },
        {
          key: "updated",
          header: "Дата изменения",
          width: "140px",
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {r.updatedAt}
            </span>
          ),
        },
      );
    } else {
      base.push(
        {
          key: "created",
          header: "Дата создания",
          width: "130px",
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {r.createdAt}
            </span>
          ),
        },
        {
          key: "updated",
          header: "Дата изменения",
          width: "130px",
          render: (r) => (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {r.updatedAt}
            </span>
          ),
        },
      );
    }

    base.push(
      {
        key: "author",
        header: "Автор",
        width: "150px",
        render: (r) => <span className="truncate">{r.author}</span>,
      },
      {
        key: "actions",
        header: "Действия",
        width: isArchive ? "180px" : "210px",
        align: "right",
        render: (r) =>
          isArchive ? (
            <ArchiveRowActions
              row={r}
              onOpen={() => handleOpen(r)}
              onRestore={() => restoreScenario(r.id)}
              onDelete={() => setConfirmDelete(r)}
              onInfo={() => setInfoTarget(r)}
              onChangeLog={() => setChangeLogTarget(r)}
            />
          ) : (
            <ActiveRowActions
              row={r}
              onOpen={() => handleOpen(r)}
              onArchive={() => archiveScenario(r.id)}
              onCopy={() => setCopySource(r)}
              onInfo={() => setInfoTarget(r)}
              onShare={() => setShareTarget(r)}
              onChangeLog={() => setChangeLogTarget(r)}
            />
          ),
      },
    );

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArchive, scenarios, selectMode, selectedIds]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
      <header className="flex items-end justify-between gap-4 pb-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div>
          <div className="text-[11px] font-medium text-muted-foreground mb-1">
            Стартовый экран
          </div>
          <h1 className="text-base font-semibold" style={{ fontSize: "var(--text-base)" }}>Реестр сценариев</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Выбор рабочего контекста перед входом в систему. Открытие сценария переводит на карту сети.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToolbarButton variant="outline" onClick={() => setLoadState("loading")}>
            <RefreshCcw className="w-3.5 h-3.5" />
            Обновить
          </ToolbarButton>
          {!isArchive && (
            <ToolbarButton
              variant={selectMode ? "solid" : "outline"}
              onClick={() => setSelectMode((value) => !value)}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              {selectMode ? "Завершить выбор" : "Выбрать для сопоставления"}
            </ToolbarButton>
          )}
          {!isArchive && (
            <ToolbarButton variant="solid" onClick={() => setCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Создать сценарий
            </ToolbarButton>
          )}
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 surface p-1">
          {(["active", "archive"] as Tab[]).map((t) => {
            const count = scenarios.filter((s) =>
              t === "active" ? !s.archived : !!s.archived,
            ).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5",
                  tab === t
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {t === "active" ? "Активные" : "Архив"}
                <span
                  className={cn(
                    "tabular-nums text-[10px] px-1.5 rounded",
                    tab === t ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[280px] justify-end">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или автору"
              className="w-full bg-card rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring border border-border"
            />
          </div>
          {!isArchive && (
            <div className="flex items-center gap-0.5 surface p-1">
              {(["all", "system", "user"] as TypeFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-md transition-all",
                    effectiveTypeFilter === f
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  {TYPE_LABEL[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isArchive && (
        <div
          className="flex items-start gap-2.5 px-3 py-2 text-xs rounded-md"
          style={{
            borderLeft: "2px solid var(--status-stale)",
            background: "color-mix(in srgb, var(--status-stale) 8%, transparent)",
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/80">
            <span className="font-medium text-[var(--status-stale)]">Архив сценариев.</span>{" "}
            Здесь отображаются только архивные пользовательские сценарии. Прямое редактирование из архива недоступно — восстановите сценарий, чтобы продолжить работу.
          </div>
        </div>
      )}

      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-3">
        <span>
          Всего: <span className="text-foreground">{filtered.length}</span>
        </span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>Вкладка: {isArchive ? "Архив" : "Активные"}</span>
        {!isArchive && selectMode && (
          <>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>
              Выбрано для сопоставления:{" "}
              <span className="text-foreground">{selectedIds.length}</span>
            </span>
          </>
        )}
      </div>

      {loadState === "loading" && <LoadingState label="Загрузка сценариев…" />}
      {loadState === "error" && (
        <ErrorState
          message={
            isArchive
              ? "Не удалось загрузить архив сценариев."
              : "Не удалось загрузить реестр сценариев."
          }
          onRetry={() => setLoadState("ready")}
        />
      )}
      {loadState === "ready" && (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={isArchive || selectMode ? undefined : handleOpen}
          dense
          className={cn(isArchive && "bg-muted/20")}
          emptyState={
            isArchive ? (
              query ? (
                <EmptyState
                  title="Ничего не найдено в архиве"
                  description="Скорректируйте поисковый запрос."
                  action={
                    <ToolbarButton variant="outline" onClick={() => setQuery("")}>
                      Сбросить поиск
                    </ToolbarButton>
                  }
                />
              ) : (
                <EmptyState
                  title="В архиве пусто"
                  description="Архивированные пользовательские сценарии появятся здесь после переноса из активного списка."
                />
              )
            ) : query || typeFilter !== "all" ? (
              <EmptyState
                title="Ничего не найдено"
                description="Скорректируйте поисковый запрос или сбросьте фильтры."
                action={
                  <ToolbarButton
                    variant="outline"
                    onClick={() => {
                      setQuery("");
                      setTypeFilter("all");
                    }}
                  >
                    Сбросить фильтры
                  </ToolbarButton>
                }
              />
            ) : (
              <EmptyState
                title="Список сценариев пуст"
                description="Создайте новый сценарий, чтобы начать работу."
              />
            )
          }
        />
      )}

      {!isArchive && selectMode && (
        <div className="sticky bottom-4 z-20 flex justify-center pointer-events-none">
          <div className="pointer-events-auto surface px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="text-xs text-muted-foreground">
              Выбрано: <span className="text-foreground font-medium">{selectedIds.length}</span> из 4
            </div>
            <ToolbarButton
              variant="solid"
              disabled={selectedIds.length < 2}
              onClick={() => {
                const nextBaseline = baselineTargetId ?? selectedIds[0] ?? null;
                setBaselineTargetId(nextBaseline);
                setCompareDialogOpen(true);
              }}
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Сопоставить ({selectedIds.length})
            </ToolbarButton>
          </div>
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title="Окончательное удаление сценария"
        description="Действие необратимо. Сценарий и его change log удаляются из системы без возможности восстановления."
        size="sm"
        footer={
          <>
            <ToolbarButton variant="outline" onClick={() => setConfirmDelete(null)}>
              Отмена
            </ToolbarButton>
            <ToolbarButton
              variant="solid"
              className="bg-[var(--status-error)] border-[var(--status-error)] hover:bg-[var(--status-error)]/90"
              onClick={() => {
                if (confirmDelete) deleteScenario(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить окончательно
            </ToolbarButton>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="surface-soft px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.1em] font-mono text-muted-foreground mb-0.5">
              Сценарий
            </div>
            <div className="font-medium">{confirmDelete?.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Автор: {confirmDelete?.author} · Кол-во проектов: {confirmDelete?.projectCount}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Вместо удаления вы можете восстановить сценарий и продолжить работу.
          </p>
        </div>
      </Modal>

      <BaselineSelectionModal
        open={compareDialogOpen}
        scenarios={selectedScenarios}
        baselineId={baselineTargetId}
        staleConfirmed={staleConfirmed}
        onBaselineChange={setBaselineTargetId}
        onStaleConfirmedChange={setStaleConfirmed}
        onOpenChange={(open) => {
          setCompareDialogOpen(open);
          if (!open) setStaleConfirmed(false);
        }}
        onConfirm={() => {
          if (!baselineTargetId) return;
          navigate(
            `/registry/compare?scenarios=${selectedIds.join(",")}&baseline=${baselineTargetId}`,
          );
        }}
      />

      <CreateScenarioModal open={createOpen} onOpenChange={setCreateOpen} />
      <CopyScenarioDialog
        source={copySource}
        onOpenChange={(o) => !o && setCopySource(null)}
      />
      <ScenarioInfoDrawer
        scenario={infoTarget}
        onOpenChange={(o) => !o && setInfoTarget(null)}
      />
      <ShareScenarioModal
        scenario={shareTarget}
        onOpenChange={(o) => !o && setShareTarget(null)}
      />
      <ChangeLogDrawer
        scenario={changeLogTarget}
        onOpenChange={(o) => !o && setChangeLogTarget(null)}
      />
    </div>
  );
}

function TypeBadge({ type }: { type: ScenarioSummary["type"] }) {
  const isSystem = type === "system";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        isSystem
          ? "bg-primary/8 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {isSystem ? "Системный" : "Пользовательский"}
    </span>
  );
}

function BaselineSelectionModal({
  open,
  scenarios,
  baselineId,
  staleConfirmed,
  onBaselineChange,
  onStaleConfirmedChange,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  scenarios: ScenarioSummary[];
  baselineId: string | null;
  staleConfirmed: boolean;
  onBaselineChange: (id: string) => void;
  onStaleConfirmedChange: (value: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const selectedBaseline =
    scenarios.find((scenario) => scenario.id === baselineId) ?? null;
  const hasStaleScenarios = scenarios.some(
    (scenario) => scenario.calcStatus === "stale_after_changes",
  );
  const blocked = scenarios.some(
    (scenario) => !getScenarioCompareGate(scenario).selectable,
  );
  const baselineGate = selectedBaseline
    ? getScenarioCompareGate(selectedBaseline)
    : null;
  const canConfirm =
    scenarios.length >= 2 &&
    !!baselineId &&
    !blocked &&
    (!hasStaleScenarios || staleConfirmed);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Выбор базового сценария"
      description="Baseline используется как точка отсчёта для дельт по KPI и состава проектов."
      size="md"
      footer={
        <>
          <ToolbarButton variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </ToolbarButton>
          <ToolbarButton
            variant="solid"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Открыть сопоставление
          </ToolbarButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="surface divide-y divide-[var(--border-soft)]">
          {scenarios.map((scenario) => {
            const gate = getScenarioCompareGate(scenario);
            return (
              <label
                key={scenario.id}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30"
              >
                <input
                  type="radio"
                  name="baseline"
                  checked={baselineId === scenario.id}
                  onChange={() => onBaselineChange(scenario.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{scenario.name}</span>
                    <TypeBadge type={scenario.type} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {scenario.updatedAt} · {scenario.projectCount} проект(ов)
                  </div>
                  {gate.warning && (
                    <div className="mt-1 text-[11px] text-[var(--status-stale)]">
                      {gate.warning}
                    </div>
                  )}
                  {gate.baselineCaution && baselineId === scenario.id && (
                    <div className="mt-1 text-[11px] text-[var(--status-stale)]">
                      {gate.baselineCaution}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {baselineGate?.baselineCaution && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md text-xs bg-[var(--status-stale)]/10">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-stale)] shrink-0 mt-0.5" />
            <span>{baselineGate.baselineCaution}</span>
          </div>
        )}

        {hasStaleScenarios && (
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={staleConfirmed}
              onChange={(event) => onStaleConfirmedChange(event.target.checked)}
            />
            <span>
              Подтверждаю, что хотя бы один сценарий имеет статус «Устарело после изменений», и всё равно хочу открыть сопоставление.
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
}

function ActiveRowActions({
  row,
  onOpen,
  onArchive,
  onCopy,
  onInfo,
  onShare,
  onChangeLog,
}: {
  row: ScenarioSummary;
  onOpen: () => void;
  onArchive: () => void;
  onCopy: () => void;
  onInfo: () => void;
  onShare: () => void;
  onChangeLog: () => void;
}) {
  const isSystem = row.type === "system";
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <IconBtn label="Открыть" onClick={onOpen}>
        <FolderOpen className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Информация о сценарии" onClick={onInfo}>
        <Info className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Скопировать" onClick={onCopy}>
        <Copy className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Поделиться" onClick={onShare}>
        <Share2 className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Журнал изменений" onClick={onChangeLog}>
        <History className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn
        label={isSystem ? "Архивирование недоступно для системного сценария" : "Архивировать"}
        disabled={isSystem}
        onClick={isSystem ? undefined : onArchive}
      >
        <Archive className="w-3.5 h-3.5" />
      </IconBtn>
    </div>
  );
}

function ArchiveRowActions({
  row,
  onOpen,
  onInfo,
  onRestore,
  onDelete,
  onChangeLog,
}: {
  row: ScenarioSummary;
  onOpen: () => void;
  onInfo: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onChangeLog: () => void;
}) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <IconBtn label="Открыть (read-only)" onClick={onOpen}>
        <FolderOpen className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label={`Информация о сценарии — ${row.name}`} onClick={onInfo}>
        <Info className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Журнал изменений" onClick={onChangeLog}>
        <History className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Восстановить" onClick={onRestore} variant="primary">
        <ArchiveRestore className="w-3.5 h-3.5" />
      </IconBtn>
      <IconBtn label="Удалить окончательно" onClick={onDelete} variant="danger">
        <Trash2 className="w-3.5 h-3.5" />
      </IconBtn>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  variant = "ghost",
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-sm transition-colors",
        variant === "ghost" && "text-muted-foreground hover:text-foreground hover:bg-muted",
        variant === "primary" &&
          "text-[var(--status-actual)] hover:bg-[var(--status-actual)]/10",
        variant === "danger" &&
          "text-[var(--status-error)] hover:bg-[var(--status-error)]/10",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
