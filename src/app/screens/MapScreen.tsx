import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Layers,
  Plus,
  Download,
  CalendarRange,
  Lock,
  RefreshCcw,
  GitCompareArrows,
} from "lucide-react";
import { StatusBadge } from "../primitives/StatusBadge";
import { KpiStrip } from "../primitives/KpiStrip";
import { ErrorState } from "../primitives/States";
import { MapCanvas } from "../map/MapCanvas";
import { YearSlider } from "../map/YearSlider";
import { SelectedProjectPanel } from "../map/SelectedProjectPanel";
import { CompareBasketPanel } from "../map/CompareBasketPanel";
import { useScenario } from "../state/ScenarioContext";
import { useCompare } from "../state/CompareContext";
import { useProjects } from "../state/ProjectsContext";
import { AddProjectModal } from "./AddProjectModal";
import { GanttModal } from "../overlays/GanttModal";
import {
  STATUS_LABEL,
  TYPE_COLOR,
  type ProjectGeo,
  type ProjectRealStatus,
} from "../map/projectsData";
import type { CalcStatus } from "../types";
import { cn } from "../lib/cn";
import { ToolbarButton } from "../primitives/Toolbar";

type LoadState = "loading" | "ready" | "empty" | "error";
type LayerMode = "type" | "status" | "year";

const ALL_TYPES: ProjectGeo["type"][] = [
  "ВСМ",
  "СМ",
  "ВСМ Международный",
  "ВСМ Введённый",
];
const ALL_STATUSES: ProjectRealStatus[] = ["introduced", "in_development", "draft"];

export function MapScreen() {
  const navigate = useNavigate();
  const { activeScenario } = useScenario();
  const compare = useCompare();
  const { getScenarioProjects } = useProjects();
  const scenarioProjects = useMemo(
    () => getScenarioProjects(activeScenario?.id ?? null),
    [getScenarioProjects, activeScenario?.id],
  );

  const startYear = activeScenario?.startYear ?? 2025;
  const endYear = activeScenario?.endYear ?? 2050;

  const [year, setYear] = useState<number>(() => endYear);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [typeFilter, setTypeFilter] = useState<ProjectGeo["type"][]>(ALL_TYPES);
  const [statusFilter, setStatusFilter] = useState<ProjectRealStatus[]>(ALL_STATUSES);
  const [layerMode, setLayerMode] = useState<LayerMode>("type");
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [evictedNames, setEvictedNames] = useState<string[]>([]);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [ganttOpen, setGanttOpen] = useState(false);

  useEffect(() => {
    setYear(endYear);
  }, [activeScenario?.id, startYear, endYear]);

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 280);
    return () => clearTimeout(t);
  }, [activeScenario?.id]);

  const visibleProjects = useMemo(() => {
    return scenarioProjects.filter(
      (p) =>
        typeFilter.includes(p.type) && statusFilter.includes(p.realStatus),
    );
  }, [scenarioProjects, typeFilter, statusFilter]);

  const projectsInYear = useMemo(
    () => visibleProjects.filter((p) => p.commissionYear <= year),
    [visibleProjects, year],
  );

  const selectedProject = useMemo(
    () =>
      selectedId
        ? scenarioProjects.find((p) => p.id === selectedId) ?? null
        : null,
    [selectedId, scenarioProjects],
  );

  // Drop selection if it falls outside current filters.
  useEffect(() => {
    if (!selectedId) return;
    const stillVisible = visibleProjects.some((p) => p.id === selectedId);
    if (!stillVisible) setSelectedId(null);
  }, [selectedId, visibleProjects]);

  // Compare basket: prune anything outside the current year slice and surface feedback.
  useEffect(() => {
    if (compare.basket.length === 0) return;
    const allowed = projectsInYear.map((p) => p.id);
    const removed = compare.pruneTo(allowed);
    if (removed.length > 0) {
      const names = removed.map(
        (id) => scenarioProjects.find((p) => p.id === id)?.name ?? id,
      );
      setEvictedNames(names);
    }
  }, [projectsInYear, compare, scenarioProjects]);

  const isEmpty = activeScenario && scenarioProjects.length === 0;

  const kpiStatus: CalcStatus = activeScenario?.calcStatus ?? "not_calculated";
  const kpis = useMemo(() => buildKpis(projectsInYear), [projectsInYear]);

  const isSystem = activeScenario?.type === "system";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Map toolbar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-2 bg-card"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <StatusBadge status={kpiStatus} />
          <span className="shrink-0" style={{ width: 1, height: 18, background: "var(--border)", display: "inline-block", margin: "0 4px" }} />
          {/* Layers */}
          <div className="relative">
            <ToolbarButton
              variant="ghost"
              active={layersOpen}
              onClick={() => setLayersOpen((v) => !v)}
            >
              <Layers className="w-3.5 h-3.5" />
              Слои
            </ToolbarButton>
            {layersOpen && (
              <>
                <div
                  className="fixed inset-0 z-[1000]"
                  onClick={() => setLayersOpen(false)}
                  aria-hidden
                />
                <div
                  className="absolute left-0 top-full mt-1.5 z-[1001] bg-card rounded-xl p-2 min-w-[260px]"
                  style={{ boxShadow: "var(--shadow-overlay)" }}
                >
                  <div className="text-[10px] font-medium text-muted-foreground px-2 py-1.5">
                    Тематический слой
                  </div>
                  {(
                    [
                      ["type", "По типу проекта"],
                      ["status", "По статусу"],
                      ["year", "По году ввода"],
                    ] as [LayerMode, string][]
                  ).map(([k, label]) => (
                    <label
                      key={k}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted rounded-md cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="layer"
                        checked={layerMode === k}
                        onChange={() => setLayerMode(k)}
                        className="accent-[var(--accent)]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <div
                    className="mt-1 pt-1.5 px-2 pb-1 text-[10px] text-muted-foreground leading-relaxed"
                    style={{ borderTop: "1px solid var(--border-soft)" }}
                  >
                    В прототипе слои визуализируются цветовыми бейджами маршрутов; тайловая стилизация — backlog v2.
                  </div>
                </div>
              </>
            )}
          </div>
          <ToolbarButton
            variant="ghost"
            onClick={() => setGanttOpen(true)}
            disabled={!activeScenario || scenarioProjects.length === 0}
            title={
              !activeScenario
                ? "Сценарий не выбран"
                : scenarioProjects.length === 0
                  ? "В сценарии нет проектов"
                  : "Открыть гант проектов сценария"
            }
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Показать гант
          </ToolbarButton>
          <ToolbarButton
            variant={compareMode ? "solid" : "ghost"}
            onClick={() => {
              setCompareMode((v) => {
                const next = !v;
                if (next) setSelectedId(null);
                else setEvictedNames([]);
                return next;
              });
            }}
            title="Множественный выбор проектов на карте"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Режим сравнения
            {compareMode && compare.basket.length > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded bg-primary-foreground/20 text-[10px] tabular-nums">
                {compare.basket.length}
              </span>
            )}
          </ToolbarButton>
          <ToolbarButton
            variant="ghost"
            onClick={() => setAddProjectOpen(true)}
            disabled={isSystem || !activeScenario}
            title={
              isSystem
                ? "Сначала создайте пользовательскую копию сценария"
                : undefined
            }
          >
            {isSystem ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            Добавить проект
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ToolbarButton
            variant="ghost"
            onClick={() => {
              setLoadState("loading");
              setTimeout(() => setLoadState("ready"), 280);
            }}
            title="Обновить карту"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton variant="ghost">
            <Download className="w-3.5 h-3.5" />
            Экспорт текущего экрана
          </ToolbarButton>
        </div>
      </div>

      <div className="px-4 pt-3">
        <KpiStrip items={kpis} />
      </div>

      <div className="px-4 pt-3">
        <FilterBar
          types={typeFilter}
          onTypes={setTypeFilter}
          statuses={statusFilter}
          onStatuses={setStatusFilter}
          year={year}
          totalVisible={projectsInYear.length}
          totalScenario={visibleProjects.length}
        />
      </div>

      <div className="flex-1 min-h-0 px-4 pt-3 flex">
        {loadState === "error" ? (
          <div className="flex-1 min-w-0 h-full flex items-center justify-center surface">
            <ErrorState
              message="Не удалось загрузить карту сети."
              onRetry={() => {
                setLoadState("loading");
                setTimeout(() => setLoadState("ready"), 280);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 min-w-0 relative h-full">
            <MapCanvas
              state={
                loadState === "loading"
                  ? "loading"
                  : isEmpty || visibleProjects.length === 0
                    ? "empty"
                    : "ready"
              }
              selectedYear={year}
              filter={{
                types: typeFilter,
                statuses: statusFilter,
              }}
              projects={scenarioProjects}
              selectedId={compareMode ? null : selectedId}
              highlightIds={compareMode ? compare.basket : undefined}
              onSelect={(id) => {
                if (compareMode) {
                  if (id) compare.toggle(id);
                } else {
                  setSelectedId(id);
                }
              }}
            />
            {loadState === "ready" && visibleProjects.length > 0 && (
              <Legend mode={layerMode} year={year} />
            )}
          </div>
        )}
        {/* Side panel with smooth width + gap animation */}
        <div
          className="shrink-0 overflow-hidden h-full"
          style={{
            width: compareMode || selectedProject ? 360 : 0,
            marginLeft: compareMode || selectedProject ? 12 : 0,
            transition: "width 200ms ease-out, margin-left 200ms ease-out",
          }}
        >
          {compareMode ? (
            <CompareBasketPanel
              ids={compare.basket}
              year={year}
              evictedNames={evictedNames}
              onRemove={compare.remove}
              onClear={() => {
                compare.clear();
                setEvictedNames([]);
              }}
              onClose={() => {
                setCompareMode(false);
                setEvictedNames([]);
              }}
              onOpenCompare={() => navigate("/compare")}
              onDismissEvicted={() => setEvictedNames([])}
            />
          ) : (
            selectedProject && (
              <SelectedProjectPanel
                project={selectedProject}
                onClose={() => setSelectedId(null)}
                onOpenCard={() => navigate(`/projects/${selectedProject.id}`)}
              />
            )
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <YearSlider
          start={startYear}
          end={endYear}
          value={year}
          onChange={setYear}
        />
      </div>

      {addNotice && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm border border-[var(--status-actual)]/40 bg-card shadow-md rounded-sm px-3 py-2 text-xs flex items-start gap-2">
          <span
            aria-hidden
            className="mt-0.5 inline-block w-2 h-2 rounded-full bg-[var(--status-actual)]"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium">Проект добавлен в сценарий</div>
            <div className="text-muted-foreground truncate">{addNotice}</div>
          </div>
          <button
            onClick={() => setAddNotice(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Скрыть уведомление"
          >
            ×
          </button>
        </div>
      )}

      <AddProjectModal
        open={addProjectOpen}
        scenario={activeScenario}
        onOpenChange={setAddProjectOpen}
        onAdded={(p) => {
          setAddNotice(p.name);
          setSelectedId(p.id);
          setTimeout(() => setAddNotice(null), 5000);
        }}
      />

      <GanttModal
        open={ganttOpen}
        onOpenChange={setGanttOpen}
        projects={scenarioProjects}
        scenarioName={activeScenario?.name ?? "—"}
        scenarioStart={startYear}
        scenarioEnd={endYear}
      />
    </div>
  );
}

function FilterBar({
  types,
  onTypes,
  statuses,
  onStatuses,
  year,
  totalVisible,
  totalScenario,
}: {
  types: ProjectGeo["type"][];
  onTypes: (v: ProjectGeo["type"][]) => void;
  statuses: ProjectRealStatus[];
  onStatuses: (v: ProjectRealStatus[]) => void;
  year: number;
  totalVisible: number;
  totalScenario: number;
}) {
  const toggleType = (t: ProjectGeo["type"]) =>
    onTypes(types.includes(t) ? types.filter((x) => x !== t) : [...types, t]);
  const toggleStatus = (s: ProjectRealStatus) =>
    onStatuses(
      statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s],
    );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          Тип
        </span>
        {ALL_TYPES.map((t) => {
          const on = types.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm text-[10px] font-medium",
                on
                  ? "bg-card text-foreground border-[var(--border-soft)]"
                  : "bg-transparent text-muted-foreground border-[var(--border-soft)]/60 hover:bg-muted",
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLOR[t] }}
              />
              {t}
            </button>
          );
        })}
      </div>
      <span className="text-border">·</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          Статус
        </span>
        {ALL_STATUSES.map((s) => {
          const on = statuses.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                "px-1.5 py-0.5 border rounded-sm uppercase tracking-wide text-[10px] font-medium",
                on
                  ? "bg-card text-foreground border-[var(--border-soft)]"
                  : "bg-transparent text-muted-foreground border-[var(--border-soft)]/60 hover:bg-muted",
              )}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>
      <div className="ml-auto text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground tabular-nums">
        В срезе {year}: <span className="text-foreground">{totalVisible}</span> из {totalScenario}
      </div>
    </div>
  );
}

function Legend({ mode, year }: { mode: LayerMode; year: number }) {
  return (
    <div className="absolute bottom-3 left-6 z-[1001] bg-card/95 rounded-md px-3 py-2 backdrop-blur-sm"
      style={{ boxShadow: "var(--shadow-overlay)" }}>
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
        Слой:{" "}
        {mode === "type"
          ? "по типу"
          : mode === "status"
            ? "по статусу"
            : "по году ввода"}
      </div>
      {mode === "type" && (
        <ul className="space-y-1">
          {ALL_TYPES.map((t) => (
            <li key={t} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-3 h-0.5 rounded-sm"
                style={{ backgroundColor: TYPE_COLOR[t] }}
              />
              {t}
            </li>
          ))}
        </ul>
      )}
      {mode === "status" && (
        <ul className="space-y-1">
          {ALL_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-2 text-[11px]">
              <span className="w-3 h-0.5 rounded-sm bg-foreground/60" />
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ul>
      )}
      {mode === "year" && (
        <div className="text-[11px] flex items-center gap-2">
          <span>≤ {year}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">{year + 1}+</span>
        </div>
      )}
      <div className="mt-2 pt-1.5 border-t border-[var(--border-soft)] text-[10px] text-muted-foreground leading-snug">
        Будущие проекты — пунктир, полупрозрачно.
      </div>
    </div>
  );
}

function buildKpis(projects: ProjectGeo[]) {
  const sum = (k: keyof ProjectGeo) =>
    projects.reduce((acc, p) => acc + (p[k] as number), 0);

  const fmt = (n: number, digits = 1) =>
    n === 0 ? "—" : n.toFixed(digits).replace(".", ",");
  const fmtInt = (n: number) =>
    n === 0 ? "—" : Math.round(n).toLocaleString("ru-RU");

  return [
    { label: "Прирост ВВП", value: fmt(sum("gdpTrln"), 2), unit: "трлн руб." },
    { label: "Население в зоне влияния", value: fmt(sum("populationMln")), unit: "млн чел." },
    { label: "Пассажиропоток", value: fmt(sum("passengersMln")), unit: "млн чел./год" },
    { label: "Протяжённость сети", value: fmtInt(sum("lengthKm")), unit: "км" },
    { label: "Потребный парк", value: fmtInt(sum("fleet")), unit: "составов" },
    { label: "Инвестиции", value: fmtInt(sum("investmentBln")), unit: "млрд руб." },
  ];
}