import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Download,
  Scale,
  ArrowDownToLine,
  ArrowUpToLine,
  AlertTriangle,
  Loader2,
  Lock,
  Check,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from "lucide-react";
import { SectionHeader } from "../primitives/SectionHeader";
import { ToolbarButton } from "../primitives/Toolbar";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "../primitives/States";
import {
  useRanking,
  type RankingResult,
  type RankingResultRow,
} from "../state/RankingContext";
import { useScenario } from "../state/ScenarioContext";
import { useProjects } from "../state/ProjectsContext";
import { useExport } from "../state/ExportContext";
import type { RankingCriterion } from "../types";
import type { ProjectGeo } from "../map/projectsData";
import { cn } from "../lib/cn";
import { RankingScoreChart } from "../charts/AnalysisCharts";

interface CriterionGroup {
  id: string;
  label: string;
  itemIds: string[];
}

interface CriterionMeta extends RankingCriterion {
  groupId: string;
  /** Whether project-level data exists in the current model to compute it. */
  computable: boolean;
  extract?: (p: ProjectGeo) => number;
}

const META: CriterionMeta[] = [
  {
    id: "passenger_demand",
    label: "Перспективный пассажиропоток",
    weight: 12,
    direction: "max",
    groupId: "transport",
    computable: true,
    extract: (p) => p.passengersMln,
  },
  {
    id: "induced_pkm",
    label: "Индуцированный пассажирооборот",
    weight: 8,
    direction: "max",
    groupId: "transport",
    computable: true,
    extract: (p) => p.passengersMln * p.lengthKm,
  },
  {
    id: "time_saving",
    label: "Сокращение времени поездки",
    weight: 8,
    direction: "max",
    groupId: "transport",
    computable: false,
  },
  {
    id: "capacity_extra",
    label: "Дополнительная пропускная способность",
    weight: 10,
    direction: "max",
    groupId: "capacity",
    computable: false,
  },
  {
    id: "capex_per_pax",
    label: "Удельные инвестиции на 1 пассажира",
    weight: 12,
    direction: "min",
    groupId: "capex",
    computable: true,
    extract: (p) => p.investmentBln / Math.max(p.passengersMln, 0.0001),
  },
  {
    id: "capex_per_km",
    label: "Удельные инвестиции на 1 км",
    weight: 10,
    direction: "min",
    groupId: "capex",
    computable: true,
    extract: (p) => p.investmentBln / Math.max(p.lengthKm, 0.0001),
  },
  {
    id: "soc_eff_coef",
    label: "Коэффициент социально-экономической эффективности",
    weight: 10,
    direction: "max",
    groupId: "social",
    computable: true,
    extract: (p) => p.gdpTrln / Math.max(p.investmentBln, 0.0001),
  },
  {
    id: "budget_eff_coef",
    label: "Коэффициент эффективности бюджетных вложений",
    weight: 8,
    direction: "max",
    groupId: "social",
    computable: false,
  },
  {
    id: "budget_share",
    label: "Доля бюджетного финансирования",
    weight: 6,
    direction: "min",
    groupId: "social",
    computable: false,
  },
  {
    id: "budget_payback",
    label: "Срок окупаемости бюджетных средств",
    weight: 6,
    direction: "min",
    groupId: "social",
    computable: false,
  },
  {
    id: "gdp_contribution",
    label: "Суммарный вклад в ВВП РФ",
    weight: 10,
    direction: "max",
    groupId: "social",
    computable: true,
    extract: (p) => p.gdpTrln,
  },
];

const GROUPS: CriterionGroup[] = [
  { id: "transport", label: "Транспортные критерии", itemIds: ["passenger_demand", "induced_pkm", "time_saving"] },
  { id: "capacity", label: "Дополнительная пропускная способность", itemIds: ["capacity_extra"] },
  { id: "capex", label: "Критерии капиталоёмкости", itemIds: ["capex_per_pax", "capex_per_km"] },
  { id: "social", label: "Социально-экономическая эффективность", itemIds: ["soc_eff_coef", "budget_eff_coef", "budget_share", "budget_payback", "gdp_contribution"] },
];

const DEFAULT_CRITERIA: RankingCriterion[] = META.map(({ id, label, weight, direction }) => ({
  id,
  label,
  weight,
  direction,
}));

const META_BY_ID = new Map(META.map((m) => [m.id, m]));
const LABEL_BY_ID = new Map(META.map((m) => [m.id, m.label]));

export function RankingScreen() {
  const {
    criteria,
    setCriteria,
    setWeight,
    normalize,
    weightSum,
    isValidWeightSum,
    result,
    errorMessage,
    phase,
    startCalculation,
    finishCalculation,
    failCalculation,
  } = useRanking();
  const { activeScenario } = useScenario();
  const { getScenarioProjects } = useProjects();
  const { openQuickExport } = useExport();

  const [panelOpen, setPanelOpen] = useState(true);
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());
  const calcTimer = useRef<number | null>(null);

  const toggleDisabled = (id: string) =>
    setDisabledIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const effectiveCriteria = useMemo(
    () => criteria.filter((c) => !disabledIds.has(c.id)),
    [criteria, disabledIds],
  );

  const effectiveWeightSum = useMemo(
    () => effectiveCriteria.reduce((s, c) => s + c.weight, 0),
    [effectiveCriteria],
  );
  const isEffectiveValid = Math.abs(effectiveWeightSum - 100) < 0.1;

  useEffect(() => {
    if (criteria.length === 0) setCriteria(DEFAULT_CRITERIA);
  }, [criteria.length, setCriteria]);

  useEffect(
    () => () => {
      if (calcTimer.current) window.clearTimeout(calcTimer.current);
    },
    [],
  );

  const projects = useMemo(
    () => getScenarioProjects(activeScenario?.id ?? null),
    [getScenarioProjects, activeScenario?.id],
  );

  const groupSums = useMemo(() => {
    const map = new Map(effectiveCriteria.map((c) => [c.id, c.weight]));
    return GROUPS.map((g) => ({
      id: g.id,
      sum: g.itemIds.reduce((a, id) => a + (map.get(id) ?? 0), 0),
    }));
  }, [effectiveCriteria]);

  const canCalc = isEffectiveValid && projects.length >= 2 && phase !== "in_calculation";

  const onCalculate = () => {
    if (!canCalc) return;
    startCalculation();
    calcTimer.current = window.setTimeout(() => {
      try {
        const r = computeTopsis(projects, effectiveCriteria);
        finishCalculation(r);
      } catch (e: any) {
        failCalculation(e?.message ?? "Не удалось выполнить расчёт.");
      }
    }, 900);
  };

  const onRetry = () => onCalculate();

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5">
        <SectionHeader
          eyebrow="Раздел / Ранжирование · Метод TOPSIS"
          title="Приоритизация проектов сценария"
          subtitle={
            activeScenario
              ? `Активный сценарий: ${activeScenario.name} · проектов: ${projects.length}`
              : "Сценарий не выбран — конфигурация хранится в общем контексте."
          }
          actions={
            <>
              <ToolbarButton
                variant="outline"
                onClick={() => setPanelOpen((v) => !v)}
                title={panelOpen ? "Скрыть панель критериев" : "Показать панель критериев"}
              >
                {panelOpen ? (
                  <PanelLeftClose className="w-3.5 h-3.5" />
                ) : (
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                )}
                {panelOpen ? "Скрыть критерии" : "Показать критерии"}
              </ToolbarButton>
              <ToolbarButton
                variant="outline"
                onClick={() => { setCriteria(DEFAULT_CRITERIA); setDisabledIds(new Set()); }}
                title="Восстановить веса по умолчанию"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сброс
              </ToolbarButton>
              <ToolbarButton
                variant="outline"
                onClick={normalize}
                disabled={isEffectiveValid || effectiveWeightSum === 0}
                title="Привести сумму весов к 100%"
              >
                <Scale className="w-3.5 h-3.5" />
                Нормализовать
              </ToolbarButton>
              <ToolbarButton
                variant="solid"
                onClick={onCalculate}
                disabled={!canCalc}
              >
                {phase === "in_calculation" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Рассчитать ранжирование
              </ToolbarButton>
              <ToolbarButton
                variant="outline"
                disabled={phase !== "actual"}
                onClick={() =>
                  openQuickExport({
                    sourceModule: "ranking",
                    scenarioId: activeScenario?.id ?? null,
                    filters: {
                      method: "TOPSIS",
                      criteria: effectiveCriteria.length,
                      computedAt: result?.computedAt ?? "—",
                    },
                    selection: result?.rows.map((r) => r.projectId) ?? [],
                  })
                }
              >
                <Download className="w-3.5 h-3.5" />
                Экспорт
              </ToolbarButton>
            </>
          }
          className="border-b-0"
        />
      </div>

      <div className="px-6 pb-3">
        <WeightSumStrip sum={effectiveWeightSum} valid={isEffectiveValid} onNormalize={normalize} />
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6">
        <div
          className={cn(
            "h-full grid grid-cols-1 gap-4",
            panelOpen && "lg:grid-cols-[minmax(380px,32%)_1fr]",
          )}
        >
          {panelOpen && (
            <CriteriaPanel
              criteria={criteria}
              disabledIds={disabledIds}
              groupSums={groupSums}
              onWeightChange={setWeight}
              onToggleDisabled={toggleDisabled}
            />
          )}
          <ResultPanel
            phase={phase}
            result={result}
            errorMessage={errorMessage}
            projectCount={projects.length}
            canCalc={canCalc}
            onRetry={onRetry}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- panels -------------------------------- */

function WeightSumStrip({
  sum,
  valid,
  onNormalize,
}: {
  sum: number;
  valid: boolean;
  onNormalize: () => void;
}) {
  const formatted = sum.toLocaleString("ru-RU", {
    minimumFractionDigits: sum % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  if (valid) {
    return (
      <div className="flex items-center justify-between surface px-3 py-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Сумма весов
          </span>
          <span className="font-mono tabular-nums">{formatted}%</span>
          <span className="text-[var(--status-actual)] inline-flex items-center gap-1">
            <Check className="w-3 h-3" />
            Сумма равна 100% — расчёт доступен.
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          Метод · TOPSIS
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between border border-[var(--status-stale)]/40 bg-[var(--status-stale)]/10 rounded-sm px-3 py-2 text-xs">
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-[var(--status-stale)]">
          Сумма весов
        </span>
        <span className="font-mono tabular-nums">{formatted}%</span>
        <span className="text-[var(--status-stale)] inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Сумма должна быть равна 100%. Расчёт ранжирования заблокирован.
        </span>
      </div>
      <button
        onClick={onNormalize}
        className="text-[11px] px-2 py-1 border border-[var(--status-stale)]/40 rounded-sm hover:bg-[var(--status-stale)]/20 text-[var(--status-stale)]"
      >
        Автонормализация
      </button>
    </div>
  );
}

function CriteriaPanel({
  criteria,
  disabledIds,
  groupSums,
  onWeightChange,
  onToggleDisabled,
}: {
  criteria: RankingCriterion[];
  disabledIds: Set<string>;
  groupSums: { id: string; sum: number }[];
  onWeightChange: (id: string, weight: number) => void;
  onToggleDisabled: (id: string) => void;
}) {
  const byId = new Map(criteria.map((c) => [c.id, c]));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, true])),
  );
  const toggleGroup = (id: string) =>
    setOpenGroups((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-soft)] shrink-0">
        <div className="text-sm font-medium">Критерии и веса</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Распределите 100% между активными критериями. Критерии можно включать и выключать.
        </div>
      </div>
      <div className="overflow-auto flex-1 min-h-0">
        {GROUPS.map((group) => {
          const sum = groupSums.find((g) => g.id === group.id)?.sum ?? 0;
          const open = openGroups[group.id];
          return (
            <div key={group.id} className="border-b border-[var(--border-soft)] last:border-b-0">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/40 text-left"
              >
                {open ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-medium flex-1">{group.label}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {Math.round(sum * 10) / 10}%
                </span>
              </button>
              {open && (
                <div className="bg-muted/10">
                  {group.itemIds.map((cid) => {
                    const live = byId.get(cid);
                    const meta = META_BY_ID.get(cid);
                    if (!live || !meta) return null;
                    const isDisabled = disabledIds.has(cid);
                    return (
                      <div
                        key={cid}
                        className={cn(
                          "px-4 py-3 border-t border-[var(--border-soft)] first:border-t-0",
                          isDisabled && "opacity-45",
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          {/* Enable/disable toggle */}
                          <button
                            onClick={() => onToggleDisabled(cid)}
                            title={isDisabled ? "Включить критерий" : "Выключить критерий"}
                            className={cn(
                              "shrink-0 w-7 h-4 rounded-full transition-colors mt-0.5 relative",
                              isDisabled
                                ? "bg-muted"
                                : "bg-[var(--accent)]",
                            )}
                            aria-checked={!isDisabled}
                            role="switch"
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm",
                                isDisabled ? "left-0.5" : "left-3.5",
                              )}
                            />
                          </button>
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-muted text-muted-foreground shrink-0 mt-0.5"
                            title={
                              live.direction === "max"
                                ? "Чем больше — тем лучше"
                                : "Чем меньше — тем лучше"
                            }
                          >
                            {live.direction === "max" ? (
                              <ArrowUpToLine className="w-3 h-3" />
                            ) : (
                              <ArrowDownToLine className="w-3 h-3" />
                            )}
                          </span>
                          <div className="text-xs leading-snug flex-1 min-w-0">
                            {live.label}
                          </div>
                          {!meta.computable && (
                            <span
                              title="Нет данных в карточках проектов — критерий не учитывается в расчёте"
                              className="inline-flex items-center text-muted-foreground shrink-0 mt-0.5"
                            >
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 pl-14">
                          <input
                            type="range"
                            min={0}
                            max={50}
                            step={0.5}
                            value={live.weight}
                            disabled={isDisabled}
                            onChange={(e) =>
                              onWeightChange(cid, Number(e.target.value))
                            }
                            className="flex-1 accent-[var(--accent)] disabled:opacity-40"
                          />
                          <WeightInput
                            value={live.weight}
                            disabled={isDisabled}
                            onChange={(v) => onWeightChange(cid, v)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
        <span>Источник критериев</span>
        <span>Spec · раздел «Ранжирование»</span>
      </div>
    </div>
  );
}

function WeightInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 surface focus-within:ring-1 focus-within:ring-ring">
      <input
        type="number"
        min={0}
        max={100}
        step={0.5}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(0, Math.min(100, n)));
        }}
        className="w-full px-2 py-1 bg-transparent text-xs font-mono tabular-nums text-right outline-none disabled:opacity-40"
      />
      <span className="px-1.5 text-[10px] font-mono text-muted-foreground">%</span>
    </div>
  );
}

function ResultPanel({
  phase,
  result,
  errorMessage,
  projectCount,
  canCalc,
  onRetry,
}: {
  phase: ReturnType<typeof useRanking>["phase"];
  result?: RankingResult;
  errorMessage?: string;
  projectCount: number;
  canCalc: boolean;
  onRetry: () => void;
}) {
  const status =
    phase === "in_calculation"
      ? "in_calculation"
      : phase === "calculation_error"
        ? "calculation_error"
        : phase === "stale_after_changes"
          ? "stale_after_changes"
          : phase === "actual"
            ? "actual"
            : "not_calculated";

  return (
    <div className="surface flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border-soft)] flex items-center justify-between shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Результат ранжирования
          </div>
          <div className="text-sm font-medium mt-0.5">Метод TOPSIS</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {phase === "actual" || phase === "stale_after_changes" ? (
        <>
          <div className="px-3 py-3 border-b border-[var(--border-soft)] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  Визуализация · Балл TOPSIS
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Чем ближе к 1 — тем выше относительная приоритетность проекта
                  по выбранным весам.
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                Chart.js · horizontal bar
              </span>
            </div>
            <div
              className="relative"
              style={{ height: Math.max(160, result!.rows.length * 36) }}
            >
              <RankingScoreChart rows={result!.rows} />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <ResultTable result={result!} stale={phase === "stale_after_changes"} />
          </div>
        </>
      ) : phase === "in_calculation" ? (
        <div className="flex-1 min-h-[280px]">
          <LoadingState label="Расчёт TOPSIS" />
        </div>
      ) : phase === "calculation_error" ? (
        <div className="flex-1 min-h-[280px]">
          <ErrorState
            message={errorMessage ?? "Ошибка расчёта ранжирования."}
            onRetry={onRetry}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-[280px] flex items-center justify-center">
          <EmptyState
            title="Расчёт не выполнен"
            description={
              canCalc
                ? `Веса согласованы. В сценарии ${projectCount} проект(ов). Запустите расчёт ранжирования.`
                : projectCount < 2
                  ? "Для ранжирования требуется не менее двух проектов в активном сценарии."
                  : "Приведите сумму весов к 100%, чтобы запустить расчёт TOPSIS."
            }
          />
        </div>
      )}

      <div className="px-3 py-2 border-t border-[var(--border-soft)] text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground flex items-center justify-between shrink-0">
        <span>Метод</span>
        <span>TOPSIS · единственный метод в текущей версии</span>
      </div>
    </div>
  );
}

function ResultTable({ result, stale }: { result: RankingResult; stale: boolean }) {
  return (
    <div className="flex flex-col min-h-0">
      {stale && (
        <div className="px-3 py-2 border-b border-[var(--border-soft)] bg-[var(--status-stale)]/10 text-[var(--status-stale)] text-[11px] flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Веса изменились после расчёта. Запустите расчёт повторно для актуальных значений.
        </div>
      )}
      <div className="grid grid-cols-[60px_minmax(200px,1.4fr)_repeat(3,minmax(110px,1fr))_minmax(180px,1.2fr)] text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground border-b border-[var(--border-soft)] bg-muted/40">
        <div className="px-3 py-2">Ранг</div>
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">Проект</div>
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">Балл TOPSIS</div>
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">S+</div>
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">S−</div>
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">Топ-вклад критерия</div>
      </div>
      <div className="overflow-auto">
        {result.rows.map((row, idx) => (
          <ResultRowView key={row.projectId} row={row} rank={idx + 1} stripe={idx % 2 === 1} />
        ))}
      </div>
      {result.skippedCriteria.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          В расчёт не вошли критерии без данных в карточках проектов:{" "}
          <span className="text-foreground/80">
            {result.skippedCriteria
              .map((id) => LABEL_BY_ID.get(id) ?? id)
              .join(", ")}
          </span>
          . Их веса перераспределены пропорционально между остальными критериями для текущего расчёта.
        </div>
      )}
      <div className="px-3 py-2 border-t border-[var(--border-soft)] text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground flex items-center justify-between">
        <span>Расчёт</span>
        <span>{result.computedAt}</span>
      </div>
    </div>
  );
}

function ResultRowView({
  row,
  rank,
  stripe,
}: {
  row: RankingResultRow;
  rank: number;
  stripe: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[60px_minmax(200px,1.4fr)_repeat(3,minmax(110px,1fr))_minmax(180px,1.2fr)] text-xs border-b border-[var(--border-soft)] last:border-b-0",
        stripe && "bg-muted/20",
      )}
    >
      <div className="px-3 py-2 font-mono tabular-nums">{rank}</div>
      <div className="px-3 py-2 border-l border-[var(--border-soft)] truncate">{row.projectName}</div>
      <div className="px-3 py-2 border-l border-[var(--border-soft)] font-mono tabular-nums">
        {row.score.toFixed(3)}
      </div>
      <div className="px-3 py-2 border-l border-[var(--border-soft)] font-mono tabular-nums text-muted-foreground">
        {row.sPlus.toFixed(3)}
      </div>
      <div className="px-3 py-2 border-l border-[var(--border-soft)] font-mono tabular-nums text-muted-foreground">
        {row.sMinus.toFixed(3)}
      </div>
      <div className="px-3 py-2 border-l border-[var(--border-soft)]">
        {row.topContribution ? (
          <div className="flex items-center gap-2">
            <span className="truncate">
              {LABEL_BY_ID.get(row.topContribution.criterionId) ?? row.topContribution.criterionId}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {(row.topContribution.share * 100).toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- TOPSIS computation ---------------------------- */

function computeTopsis(
  projects: ProjectGeo[],
  criteria: RankingCriterion[],
): RankingResult {
  if (projects.length < 2) throw new Error("Недостаточно проектов для ранжирования.");

  const used: { id: string; weight: number; direction: "max" | "min"; values: number[] }[] = [];
  const skipped: string[] = [];

  for (const c of criteria) {
    const meta = META_BY_ID.get(c.id);
    if (!meta || !meta.computable || !meta.extract) {
      if ((c.weight ?? 0) > 0) skipped.push(c.id);
      continue;
    }
    const values = projects.map((p) => meta.extract!(p));
    used.push({ id: c.id, weight: c.weight, direction: c.direction, values });
  }

  if (used.length === 0) {
    throw new Error("Нет критериев с доступными данными в карточках проектов.");
  }

  // Reweight used criteria so they sum to 1 within the active calc.
  const wSumUsed = used.reduce((a, c) => a + c.weight, 0) || 1;
  const weights = used.map((c) => c.weight / wSumUsed);

  // Vector-normalize each criterion column.
  const normCols = used.map((c) => {
    const norm = Math.sqrt(c.values.reduce((a, v) => a + v * v, 0)) || 1;
    return c.values.map((v) => v / norm);
  });

  // Weighted matrix.
  const weighted = normCols.map((col, j) => col.map((v) => v * weights[j]));

  // Ideal best/worst per criterion respecting direction.
  const ideal = used.map((c, j) => {
    const col = weighted[j];
    return c.direction === "max" ? Math.max(...col) : Math.min(...col);
  });
  const antiIdeal = used.map((c, j) => {
    const col = weighted[j];
    return c.direction === "max" ? Math.min(...col) : Math.max(...col);
  });

  // Distances and score per project.
  const rows: RankingResultRow[] = projects.map((p, i) => {
    let sPlusSq = 0;
    let sMinusSq = 0;
    const contrib: { id: string; share: number }[] = [];
    let totalContrib = 0;
    used.forEach((_, j) => {
      const v = weighted[j][i];
      const dPlus = (v - ideal[j]) ** 2;
      const dMinus = (v - antiIdeal[j]) ** 2;
      sPlusSq += dPlus;
      sMinusSq += dMinus;
      const c = dMinus;
      contrib.push({ id: used[j].id, share: c });
      totalContrib += c;
    });
    const sPlus = Math.sqrt(sPlusSq);
    const sMinus = Math.sqrt(sMinusSq);
    const score = sPlus + sMinus === 0 ? 0 : sMinus / (sPlus + sMinus);
    const top = contrib
      .map((c) => ({ id: c.id, share: totalContrib === 0 ? 0 : c.share / totalContrib }))
      .sort((a, b) => b.share - a.share)[0];
    return {
      projectId: p.id,
      projectName: p.name,
      score,
      sPlus,
      sMinus,
      topContribution: top ? { criterionId: top.id, share: top.share } : null,
    };
  });

  rows.sort((a, b) => b.score - a.score);

  return {
    rows,
    usedCriteria: used.map((u) => u.id),
    skippedCriteria: skipped,
    computedAt: new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}