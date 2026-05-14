import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Clock3,
  GitCompareArrows,
} from "lucide-react";
import { ScenarioCompareProvider, useScenarioCompare } from "../state/ScenarioCompareContext";
import { useScenario } from "../state/ScenarioContext";
import { useExport } from "../state/ExportContext";
import { useToast } from "../state/ToastContext";
import { LoadingState, EmptyState, ErrorState } from "../primitives/States";
import { DataTable, type Column } from "../primitives/DataTable";
import {
  formatKpiDelta,
  formatKpiValue,
  getScenarioCompareGate,
  hasKpiDifferences,
  hasTimelineDifferences,
  SCENARIO_COMPARE_KPIS,
  type ScenarioCompareDataset,
  type ScenarioCompareKpiDefinition,
  type ScenarioTimelineRow,
} from "../lib/scenarioCompare";
import { ScenarioCompareHeader } from "../components/scenario-compare/ScenarioCompareHeader";
import { ScenarioCompareKPIStrip } from "../components/scenario-compare/ScenarioCompareKPIStrip";
import { ScenarioCompareTabs } from "../components/scenario-compare/ScenarioCompareTabs";
import { ScenarioCompareUtilityRail } from "../components/scenario-compare/ScenarioCompareUtilityRail";
import { ProjectDiffTable } from "../components/scenario-compare/ProjectDiffTable";
import { GroupedBarChart } from "../components/scenario-compare/GroupedBarChart";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { cn } from "../lib/cn";

export function ScenarioCompareScreen() {
  return (
    <ScenarioCompareProvider>
      <ScenarioCompareScreenContent />
    </ScenarioCompareProvider>
  );
}

function ScenarioCompareScreenContent() {
  const navigate = useNavigate();
  const { scenarios, setActiveScenario } = useScenario();
  const { openQuickExport } = useExport();
  const toast = useToast();
  const {
    phase,
    scenarioIds,
    baselineId,
    activeTab,
    onlyDifferences,
    datasets,
    diffRows,
    timelineRows,
    deniedScenarioIds,
    setBaselineId,
    setActiveTab,
    setOnlyDifferences,
    setScenarioIds,
    removeScenario,
  } = useScenarioCompare();

  const [actionScenarioId, setActionScenarioId] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [draftScenarioIds, setDraftScenarioIds] = useState<string[]>([]);
  const [draftStaleConfirmed, setDraftStaleConfirmed] = useState(false);

  useEffect(() => {
    const fallback = baselineId ?? datasets[0]?.scenario.id ?? "";
    setActionScenarioId((current) =>
      current && datasets.some((dataset) => dataset.scenario.id === current)
        ? current
        : fallback,
    );
  }, [baselineId, datasets]);

  useEffect(() => {
    if (!manageOpen) {
      setDraftScenarioIds(scenarioIds);
      setDraftStaleConfirmed(false);
    }
  }, [manageOpen, scenarioIds]);

  const warnings = useMemo(
    () =>
      datasets
        .map((dataset) => {
          const gate = getScenarioCompareGate(dataset.scenario);
          return gate.warning
            ? `${dataset.scenario.name}: ${gate.warning}`
            : gate.baselineCaution && dataset.scenario.id === baselineId
              ? `${dataset.scenario.name}: ${gate.baselineCaution}`
              : null;
        })
        .filter((value): value is string => Boolean(value)),
    [datasets, baselineId],
  );

  const handleExport = () => {
    openQuickExport({
      sourceModule: "scenario_compare",
      scenarioId: actionScenarioId || baselineId || null,
      filters: {
        tab: activeTab,
        onlyDifferences,
      },
      selection: scenarioIds,
    });
  };

  const handleShare = async () => {
    const href = window.location.href;
    try {
      await navigator.clipboard.writeText(href);
      toast.show({
        title: "Сопоставление сценариев",
        message: "Ссылка на текущий набор скопирована в буфер обмена.",
        tone: "success",
      });
    } catch {
      toast.show({
        title: "Сопоставление сценариев",
        message: "Не удалось скопировать ссылку автоматически.",
        tone: "warning",
      });
    }
  };

  const handleOpenScenario = () => {
    if (!actionScenarioId) return;
    setActiveScenario(actionScenarioId);
    navigate("/map");
  };

  const handleMakeActive = () => {
    if (!actionScenarioId) return;
    const target = datasets.find((dataset) => dataset.scenario.id === actionScenarioId);
    if (!target) return;
    const confirmed = window.confirm(
      `Сделать активным сценарий «${target.scenario.name}» и перейти на карту сети?`,
    );
    if (!confirmed) return;
    setActiveScenario(actionScenarioId);
    navigate("/map");
  };

  if (phase === "loading") {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <LoadingState label="Загрузка набора сопоставления" />
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <ErrorState
          message={`Некоторые сценарии недоступны по прямой ссылке: ${deniedScenarioIds.join(", ")}.`}
          onRetry={() => navigate("/")}
        />
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <EmptyState
          title="Добавьте минимум 2 сценария для сопоставления"
          description="Набор в URL содержит меньше двух сценариев. Вернитесь в реестр и соберите корректный набор."
          action={
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-3 py-1.5 rounded-md border border-[var(--border)] bg-card text-xs"
            >
              Вернуться в реестр
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-4">
      <ScenarioCompareHeader
        datasets={datasets}
        baselineId={baselineId}
        onlyDifferences={onlyDifferences}
        canRemove={datasets.length > 2}
        onBack={() => navigate("/")}
        onBaselineChange={setBaselineId}
        onManageComposition={() => setManageOpen(true)}
        onToggleOnlyDifferences={setOnlyDifferences}
        onExport={handleExport}
        onRemoveScenario={removeScenario}
      />

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-md text-xs bg-[var(--status-stale)]/10 text-foreground">
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            {warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        </div>
      )}

      <ScenarioCompareTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4 min-w-0">
          {activeTab === "kpi" && (
            <>
              <ScenarioCompareKPIStrip datasets={datasets} baselineId={baselineId} />
              <section className="surface p-4">
                <div className="text-[11px] font-medium text-muted-foreground mb-3">
                  Сравнительная визуализация KPI
                </div>
                <div style={{ height: 340 }}>
                  <GroupedBarChart datasets={datasets} baselineId={baselineId} />
                </div>
              </section>
              <ScenarioKpiTable
                datasets={datasets}
                baselineId={baselineId}
                onlyDifferences={onlyDifferences}
              />
            </>
          )}

          {activeTab === "diff" && (
            <ProjectDiffTable
              rows={diffRows}
              datasets={datasets}
              onlyDifferences={onlyDifferences}
            />
          )}

          {activeTab === "timeline" && (
            <ScenarioTimelineTable
              rows={timelineRows}
              datasets={datasets}
              onlyDifferences={onlyDifferences}
            />
          )}
        </div>

        <ScenarioCompareUtilityRail
          datasets={datasets}
          selectedScenarioId={actionScenarioId}
          onScenarioChange={setActionScenarioId}
          onOpenScenario={handleOpenScenario}
          onMakeActive={handleMakeActive}
          onShare={handleShare}
          onExport={handleExport}
        />
      </div>

      <ScenarioCompositionModal
        open={manageOpen}
        scenarios={scenarios.filter((scenario) => !scenario.archived)}
        selectedIds={draftScenarioIds}
        staleConfirmed={draftStaleConfirmed}
        onOpenChange={setManageOpen}
        onSelectedIdsChange={setDraftScenarioIds}
        onStaleConfirmedChange={setDraftStaleConfirmed}
        onConfirm={() => {
          setScenarioIds(draftScenarioIds);
          setManageOpen(false);
        }}
      />
    </div>
  );
}

function ScenarioCompositionModal({
  open,
  scenarios,
  selectedIds,
  staleConfirmed,
  onOpenChange,
  onSelectedIdsChange,
  onStaleConfirmedChange,
  onConfirm,
}: {
  open: boolean;
  scenarios: ReturnType<typeof useScenario>["scenarios"];
  selectedIds: string[];
  staleConfirmed: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectedIdsChange: (ids: string[]) => void;
  onStaleConfirmedChange: (value: boolean) => void;
  onConfirm: () => void;
}) {
  const selectedScenarios = scenarios.filter((scenario) =>
    selectedIds.includes(scenario.id),
  );
  const hasStaleScenario = selectedScenarios.some(
    (scenario) => scenario.calcStatus === "stale_after_changes",
  );
  const canConfirm =
    selectedIds.length >= 2 &&
    selectedIds.length <= 4 &&
    (!hasStaleScenario || staleConfirmed);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Состав набора сопоставления"
      description="Добавьте сценарии в набор или уберите лишние. Ограничение: от 2 до 4 сценариев."
      size="md"
      footer={
        <>
          <ToolbarButton variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </ToolbarButton>
          <ToolbarButton variant="solid" onClick={onConfirm} disabled={!canConfirm}>
            <GitCompareArrows className="w-3.5 h-3.5" />
            Применить состав
          </ToolbarButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground">
          Сейчас в наборе <span className="text-foreground font-medium">{selectedIds.length}</span> из 4 сценариев.
        </div>

        <div className="surface divide-y divide-[var(--border-soft)] max-h-[360px] overflow-auto">
          {scenarios.map((scenario) => {
            const gate = getScenarioCompareGate(scenario);
            const selected = selectedIds.includes(scenario.id);
            const maxReached = selectedIds.length >= 4 && !selected;
            const disabled = !gate.selectable || maxReached;

            return (
              <label
                key={scenario.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5",
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/30",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={disabled}
                  onChange={() => {
                    if (selected) {
                      onSelectedIdsChange(selectedIds.filter((id) => id !== scenario.id));
                      return;
                    }
                    if (selectedIds.length >= 4) return;
                    onSelectedIdsChange([...selectedIds, scenario.id]);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{scenario.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {scenario.type === "system" ? "Системный" : "Пользовательский"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {scenario.projectCount} проект(ов) · {scenario.updatedAt}
                  </div>
                  {gate.warning && (
                    <div className="mt-1 text-[11px] text-[var(--status-stale)]">
                      {gate.warning}
                    </div>
                  )}
                  {gate.blockingReason && (
                    <div className="mt-1 text-[11px] text-[var(--status-error)]">
                      {gate.blockingReason}
                    </div>
                  )}
                  {maxReached && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Можно сопоставить не более 4 сценариев.
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        {hasStaleScenario && (
          <label className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={staleConfirmed}
              onChange={(event) => onStaleConfirmedChange(event.target.checked)}
            />
            <span>
              Подтверждаю, что в наборе есть сценарий со статусом «Устарело после изменений», и всё равно хочу использовать его в сопоставлении.
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
}

function ScenarioKpiTable({
  datasets,
  baselineId,
  onlyDifferences,
}: {
  datasets: ScenarioCompareDataset[];
  baselineId: string | null;
  onlyDifferences: boolean;
}) {
  const baseline =
    datasets.find((dataset) => dataset.scenario.id === baselineId) ?? datasets[0] ?? null;

  if (!baseline) return null;

  const rows = SCENARIO_COMPARE_KPIS.filter((kpi) =>
    onlyDifferences ? hasKpiDifferences(datasets, kpi.id) : true,
  );

  const columns: Column<ScenarioCompareKpiDefinition>[] = [
    {
      key: "kpi",
      header: "Показатель",
      width: "220px",
      render: (row) => (
        <div>
          <div className="font-medium">{row.label}</div>
          <div className="text-[11px] text-muted-foreground">{row.unit}</div>
        </div>
      ),
    },
    ...datasets.map<Column<ScenarioCompareKpiDefinition>>((dataset) => ({
      key: dataset.scenario.id,
      header: dataset.scenario.name,
      render: (row) => {
        const value = dataset.kpis[row.id];
        const delta = formatKpiDelta(value, baseline.kpis[row.id], row.decimals);
        const improved =
          row.direction === "higher"
            ? value > baseline.kpis[row.id]
            : value < baseline.kpis[row.id];
        const degraded =
          row.direction === "higher"
            ? value < baseline.kpis[row.id]
            : value > baseline.kpis[row.id];
        return (
          <div>
            <div className="font-medium tabular-nums">
              {formatKpiValue(value, row.decimals)}
            </div>
            {dataset.scenario.id !== baseline.scenario.id && (
              <div
                className="mt-0.5 text-[11px]"
                style={{
                  color: improved
                    ? "var(--status-actual)"
                    : degraded
                      ? "var(--status-error)"
                      : "var(--muted-foreground)",
                }}
              >
                {delta.absolute} · {delta.percent}
              </div>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <section className="surface">
      <div className="px-4 py-3 border-b border-[var(--border-soft)]">
        <div className="text-[11px] font-medium text-muted-foreground">
          Детализация KPI по сценариям
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        dense
      />
    </section>
  );
}

function ScenarioTimelineTable({
  rows,
  datasets,
  onlyDifferences,
}: {
  rows: ScenarioTimelineRow[];
  datasets: ScenarioCompareDataset[];
  onlyDifferences: boolean;
}) {
  const filteredRows = onlyDifferences
    ? rows.filter((row) => row.hasDifferences || hasTimelineDifferences(row))
    : rows;

  const timelineStart = 2030;
  const timelineEnd = 2050;
  const span = timelineEnd - timelineStart;
  const gridTemplate = `280px repeat(${datasets.length}, minmax(180px, 1fr))`;

  const toPercent = (year: number) =>
    `${Math.max(0, Math.min(100, ((year - timelineStart) / span) * 100))}%`;

  return (
    <section className="surface overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-soft)] flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-muted-foreground">
            Время́нный профиль
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Годовой срез 2030–2050 по включённым проектам сценариев.
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock3 className="w-3.5 h-3.5" />
          2030–2050
        </div>
      </div>

      <div className="overflow-auto">
        <div className="min-w-[980px]">
          <div
            className="grid text-[10px] text-muted-foreground bg-[var(--surface-raised)]"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="px-3 py-2 border-b border-[var(--border-soft)]">Проект</div>
            {datasets.map((dataset) => (
              <div
                key={dataset.scenario.id}
                className="px-3 py-2 border-b border-l border-[var(--border-soft)]"
              >
                {dataset.scenario.name}
              </div>
            ))}
          </div>

          {filteredRows.map((row, index) => (
            <div
              key={row.key}
              className="grid"
              style={{
                gridTemplateColumns: gridTemplate,
                background:
                  index % 2 === 0 ? "var(--card)" : "var(--surface-raised)",
              }}
            >
              <div className="px-3 py-2.5 border-b border-[var(--border-soft)]">
                <div className="font-medium truncate">{row.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {row.route}
                </div>
              </div>
              {datasets.map((dataset) => {
                const project = row.valuesByScenario[dataset.scenario.id];
                return (
                  <div
                    key={dataset.scenario.id}
                    className="px-3 py-2.5 border-b border-l border-[var(--border-soft)]"
                  >
                    {!project ? (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-[11px] text-muted-foreground">
                          Ввод · {project.commissionYear}
                        </div>
                        <div className="relative h-6 rounded-sm bg-muted/30">
                          {Array.from({ length: 5 }, (_, offset) => timelineStart + offset * 5).map((year) => (
                            <span
                              key={year}
                              className="absolute top-0 bottom-0 w-px bg-border/40"
                              style={{ left: toPercent(year) }}
                            />
                          ))}
                          <div
                            className="absolute top-1.5 bottom-1.5 rounded-sm bg-primary/25"
                            style={{
                              left: toPercent(Math.max(timelineStart, project.commissionYear - 6)),
                              width: `calc(${toPercent(project.commissionYear)} - ${toPercent(
                                Math.max(timelineStart, project.commissionYear - 6),
                              )})`,
                            }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary"
                            style={{ left: toPercent(project.commissionYear) }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
