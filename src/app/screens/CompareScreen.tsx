import { useEffect, useMemo, useState } from "react";
import { Download, X, ArrowDownRight, ArrowUpRight, Plus, Check, Search } from "lucide-react";
import { Popover } from "../overlays/Popover";
import { SectionHeader } from "../primitives/SectionHeader";
import { ToolbarButton } from "../primitives/Toolbar";
import {
  ErrorState,
  LoadingState,
  PlaceholderBlock,
} from "../primitives/States";
import { useCompare } from "../state/CompareContext";
import { useProjects } from "../state/ProjectsContext";
import { useScenario } from "../state/ScenarioContext";
import { useExport } from "../state/ExportContext";
import { TYPE_COLOR, type ProjectGeo } from "../map/projectsData";
import { cn } from "../lib/cn";
import { CompareGroupedBarChart } from "../charts/AnalysisCharts";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "source", label: "Исходные данные" },
  { id: "passenger", label: "Пассажирские перевозки" },
  { id: "cargo", label: "Грузовые перевозки" },
  { id: "infra", label: "Инфраструктура" },
  { id: "finance", label: "Финансовая модель" },
  { id: "social", label: "Социально-экономические эффекты" },
  { id: "risks", label: "Участники и риски" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Direction = "higher" | "lower" | "none";

interface NumRow {
  kind: "num";
  key: string;
  label: string;
  unit?: string;
  decimals?: number;
  better: Direction;
  get: (p: ProjectGeo) => number | null | undefined;
}
interface TextRow {
  kind: "text";
  key: string;
  label: string;
  get: (p: ProjectGeo) => string;
}
type Row = NumRow | TextRow;

const ROWS_BY_TAB: Record<TabId, Row[]> = {
  overview: [
    { kind: "text", key: "type", label: "Тип проекта", get: (p) => p.type },
    {
      kind: "text",
      key: "route",
      label: "Маршрут",
      get: (p) => `${p.from} — ${p.to}`,
    },
    {
      kind: "num",
      key: "commissionYear",
      label: "Базовый год запуска",
      better: "lower",
      get: (p) => p.commissionYear,
    },
    {
      kind: "num",
      key: "lengthKm",
      label: "Протяжённость",
      unit: "км",
      better: "none",
      get: (p) => p.lengthKm,
    },
    {
      kind: "num",
      key: "passengersMln",
      label: "Пассажиропоток",
      unit: "млн/год",
      decimals: 1,
      better: "higher",
      get: (p) => p.passengersMln,
    },
    {
      kind: "num",
      key: "investmentBln",
      label: "Капитальные вложения",
      unit: "млрд руб.",
      better: "lower",
      get: (p) => p.investmentBln,
    },
  ],
  source: [
    {
      kind: "num",
      key: "lengthKm",
      label: "Протяжённость",
      unit: "км",
      better: "none",
      get: (p) => p.lengthKm,
    },
    {
      kind: "num",
      key: "commissionYear",
      label: "Базовый год запуска",
      better: "lower",
      get: (p) => p.commissionYear,
    },
    {
      kind: "num",
      key: "populationMln",
      label: "Население коридора",
      unit: "млн чел.",
      decimals: 1,
      better: "higher",
      get: (p) => p.populationMln,
    },
    {
      kind: "num",
      key: "fleet",
      label: "Парк подвижного состава",
      unit: "ед.",
      better: "none",
      get: (p) => p.fleet,
    },
    {
      kind: "text",
      key: "protectedRoute",
      label: "Защищённый маршрут",
      get: (p) => (p.protectedRoute ? "Да" : "Нет"),
    },
  ],
  passenger: [
    {
      kind: "num",
      key: "passengersMln",
      label: "Пассажиропоток (базовый)",
      unit: "млн/год",
      decimals: 1,
      better: "higher",
      get: (p) => p.passengersMln,
    },
  ],
  cargo: [],
  infra: [
    {
      kind: "num",
      key: "lengthKm",
      label: "Протяжённость",
      unit: "км",
      better: "none",
      get: (p) => p.lengthKm,
    },
    {
      kind: "num",
      key: "fleet",
      label: "Парк подвижного состава",
      unit: "ед.",
      better: "none",
      get: (p) => p.fleet,
    },
  ],
  finance: [
    {
      kind: "num",
      key: "investmentBln",
      label: "Капитальные вложения",
      unit: "млрд руб.",
      better: "lower",
      get: (p) => p.investmentBln,
    },
  ],
  social: [
    {
      kind: "num",
      key: "gdpTrln",
      label: "Прирост ВРП",
      unit: "трлн руб.",
      decimals: 2,
      better: "higher",
      get: (p) => p.gdpTrln,
    },
  ],
  risks: [],
};

const PLACEHOLDER_BY_TAB: Partial<Record<TabId, { title: string; note: string }>> = {
  passenger: {
    title: "Расширенные пассажирские показатели",
    note: "Сценарии тарифов, эластичности и распределения по сегментам появятся после фиксации модели.",
  },
  cargo: {
    title: "Сравнение по грузовым перевозкам",
    note: "Состав и объёмы грузопотоков по проектам не зафиксированы в текущей версии документации.",
  },
  infra: {
    title: "Сравнение по перегонам и станциям",
    note: "Детализация перегонов, станций и депо появится после готовности инфраструктурного блока.",
  },
  finance: {
    title: "Сравнение P&L, OPEX, схемы финансирования",
    note: "Финансовая модель в части P&L/OPEX и схемы финансирования отмечена как backlog (L1-16).",
  },
  social: {
    title: "Расширенные социально-экономические эффекты",
    note: "Расширенный реестр эффектов появится после согласования методики.",
  },
  risks: {
    title: "Реестр рисков и стейкхолдеров",
    note: "Сравнение по реестру рисков и матрице стейкхолдеров не зафиксировано в текущей версии.",
  },
};

function fmtNumber(v: number | null | undefined, decimals = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDelta(d: number, decimals = 0): string {
  if (d === 0) return "0";
  const sign = d > 0 ? "+" : "−";
  return `${sign}${Math.abs(d).toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function CompareScreen() {
  const { basket, remove, clear, toggle, has } = useCompare();
  const { getScenarioProjects } = useProjects();
  const { activeScenario } = useScenario();
  const { openQuickExport } = useExport();

  const [tab, setTab] = useState<TabId>("overview");
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const scenarioProjects = useMemo(
    () => getScenarioProjects(activeScenario?.id ?? null),
    [getScenarioProjects, activeScenario?.id],
  );

  const projects = useMemo<ProjectGeo[]>(
    () =>
      basket
        .map((id) => scenarioProjects.find((p) => p.id === id))
        .filter((p): p is ProjectGeo => Boolean(p)),
    [basket, scenarioProjects],
  );

  useEffect(() => {
    setPhase("loading");
    const t = setTimeout(() => {
      // basket items not present in current scenario => mismatch error.
      if (basket.length > 0 && projects.length !== basket.length) {
        setPhase("error");
      } else {
        setPhase("ready");
      }
    }, 220);
    return () => clearTimeout(t);
  }, [basket, projects.length]);

  if (basket.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 pt-5">
          <SectionHeader
            eyebrow="Раздел / Сравнение"
            title="Сравнение проектов"
            subtitle="Выберите минимум 2 проекта из активного сценария — сопоставление откроется сразу."
            className="border-b-0"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
          <InlineProjectPicker
            scenarioProjects={scenarioProjects}
            has={has}
            toggle={toggle}
          />
        </div>
      </div>
    );
  }

  const isPair = projects.length === 2;
  const mode: "delta" | "highlight" = isPair ? "delta" : "highlight";

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5">
        <SectionHeader
          eyebrow="Раздел / Сравнение"
          title="Сравнение проектов"
          subtitle={
            mode === "delta"
              ? `В наборе 2 проекта — режим попарной дельты по строкам.`
              : `В наборе ${projects.length} проектов — режим подсветки лучших и худших значений по строкам.`
          }
          actions={
            <>
              <Popover
                open={pickerOpen}
                onOpenChange={(o) => {
                  setPickerOpen(o);
                  if (!o) setPickerQuery("");
                }}
                className="p-0 min-w-[360px] w-[360px]"
                trigger={
                  <ToolbarButton variant="outline">
                    <Plus className="w-3.5 h-3.5" />
                    Добавить проект
                  </ToolbarButton>
                }
              >
                <div className="px-3 py-2 border-b border-[var(--border-soft)]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Поиск по названию или маршруту"
                      className="w-full bg-card border border-[var(--border-soft)] rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                <PickerList
                  scenarioProjects={scenarioProjects}
                  query={pickerQuery}
                  has={has}
                  toggle={toggle}
                />
              </Popover>
              <ToolbarButton variant="outline" onClick={clear}>
                Очистить набор
              </ToolbarButton>
              <ToolbarButton
                variant="outline"
                onClick={() =>
                  openQuickExport({
                    sourceModule: "compare",
                    scenarioId: activeScenario?.id ?? null,
                    selection: basket,
                    filters: { tab },
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

      <BasketStrip
        projects={projects}
        basketIds={basket}
        onRemove={remove}
      />

      <div className="px-6 border-b border-[var(--border-soft)] bg-card">
        <div className="flex overflow-x-auto -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors",
                tab === t.id
                  ? "border-[var(--accent)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-6 py-5 space-y-4">
        {phase === "loading" ? (
          <LoadingState label="Сборка таблицы сравнения" />
        ) : phase === "error" ? (
          <ErrorState
            message="Часть проектов из набора недоступна в текущем сценарии."
            onRetry={() => setPhase("loading")}
          />
        ) : (
          <>
            {tab === "overview" && projects.length >= 2 && (
              <section className="surface">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-soft)]">
                  <div>
                    <div className="text-sm font-medium">
                      Сводное сравнение по ключевым метрикам
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Нормированная диаграмма (% от максимума по метрике) для
                      качественного сопоставления масштабов.
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                    Chart.js · grouped bar
                  </span>
                </div>
                <div className="p-4">
                  <div className="relative h-[260px]">
                    <CompareGroupedBarChart projects={projects} />
                  </div>
                </div>
              </section>
            )}
            <CompareTable
              tab={tab}
              projects={projects}
              mode={mode}
            />
            {PLACEHOLDER_BY_TAB[tab] && (
              <PlaceholderBlock
                title={PLACEHOLDER_BY_TAB[tab]!.title}
                note={PLACEHOLDER_BY_TAB[tab]!.note}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InlineProjectPicker({
  scenarioProjects,
  has,
  toggle,
}: {
  scenarioProjects: ProjectGeo[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scenarioProjects;
    return scenarioProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.from.toLowerCase().includes(q) ||
        p.to.toLowerCase().includes(q),
    );
  }, [scenarioProjects, query]);
  const selectedCount = scenarioProjects.filter((p) => has(p.id)).length;

  return (
    <div className="surface">
      <div className="px-4 py-3 border-b border-[var(--border-soft)] flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Выбор проектов для сравнения</div>
          <div className="text-[11px] text-muted-foreground">
            Отметьте минимум 2 проекта из активного сценария — таблицы соберутся
            автоматически.
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Выбрано: {selectedCount}
        </span>
      </div>
      <div className="px-4 py-2 border-b border-[var(--border-soft)]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или маршруту"
            className="w-full bg-background border border-[var(--border-soft)] rounded-md pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">
          Ничего не найдено.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border-soft)] max-h-[520px] overflow-auto">
          {filtered.map((p) => {
            const inSet = has(p.id);
            return (
              <li key={p.id}>
                <button
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors",
                    inSet && "bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0",
                      inSet
                        ? "bg-[var(--accent)] border-[var(--accent)]"
                        : "border-[var(--border-soft)]",
                    )}
                  >
                    {inSet && (
                      <Check className="w-3 h-3 text-[var(--accent-foreground)]" />
                    )}
                  </span>
                  <span
                    className="w-2 h-2 rounded-[1px] shrink-0"
                    style={{ background: TYPE_COLOR[p.type] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {p.from} — {p.to}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {p.commissionYear}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                    {p.lengthKm.toLocaleString("ru-RU")} км
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BasketStrip({
  projects,
  basketIds,
  onRemove,
}: {
  projects: ProjectGeo[];
  basketIds: string[];
  onRemove: (id: string) => void;
}) {
  const missing = basketIds.length - projects.length;

  return (
    <div className="px-6 py-3 border-b border-[var(--border-soft)] bg-muted/30">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          Набор · {basketIds.length}
        </span>
        {projects.map((p, i) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-2 pl-2 pr-1 py-1 surface text-xs"
          >
            <span
              className="w-2 h-2 rounded-[1px]"
              style={{ background: TYPE_COLOR[p.type] }}
              aria-hidden
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="max-w-[220px] truncate">{p.name}</span>
            <button
              onClick={() => onRemove(p.id)}
              className="ml-1 p-0.5 text-muted-foreground hover:text-foreground"
              title="Убрать из набора"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {missing > 0 && (
          <span className="text-[11px] text-[var(--status-error)]">
            {missing} проект(ов) недоступно в активном сценарии
          </span>
        )}
      </div>
    </div>
  );
}

function CompareTable({
  tab,
  projects,
  mode,
}: {
  tab: TabId;
  projects: ProjectGeo[];
  mode: "delta" | "highlight";
}) {
  const rows = ROWS_BY_TAB[tab];

  if (rows.length === 0) {
    return (
      <div className="surface">
        <Header projects={projects} mode={mode} />
        <div className="px-3 py-6 text-xs text-muted-foreground border-t border-[var(--border-soft)]">
          Для этой вкладки сопоставимые табличные показатели не зафиксированы в
          документации. Доступен только структурный блок ниже.
        </div>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <Header projects={projects} mode={mode} />
      <div>
        {rows.map((row, idx) => (
          <RowView
            key={row.key}
            row={row}
            projects={projects}
            mode={mode}
            stripe={idx % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}

function Header({
  projects,
  mode,
}: {
  projects: ProjectGeo[];
  mode: "delta" | "highlight";
}) {
  return (
    <div
      className="grid border-b border-[var(--border-soft)] bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground"
      style={{
        gridTemplateColumns: gridTemplate(projects.length, mode),
      }}
    >
      <div className="px-3 py-2">Показатель</div>
      {projects.map((p, i) => (
        <div
          key={p.id}
          className="px-3 py-2 border-l border-[var(--border-soft)] min-w-0"
          title={p.name}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-[1px] flex-shrink-0"
              style={{ background: TYPE_COLOR[p.type] }}
              aria-hidden
            />
            <span className="font-mono">{String.fromCharCode(65 + i)}</span>
            <span className="truncate normal-case tracking-normal text-foreground/80">
              {p.name}
            </span>
          </div>
        </div>
      ))}
      {mode === "delta" && (
        <div className="px-3 py-2 border-l border-[var(--border-soft)]">Δ (B − A)</div>
      )}
    </div>
  );
}

function gridTemplate(n: number, mode: "delta" | "highlight") {
  const cols = `220px repeat(${n}, minmax(160px, 1fr))`;
  return mode === "delta" ? `${cols} 140px` : cols;
}

function RowView({
  row,
  projects,
  mode,
  stripe,
}: {
  row: Row;
  projects: ProjectGeo[];
  mode: "delta" | "highlight";
  stripe: boolean;
}) {
  // Pre-compute best/worst for highlight mode on numeric rows.
  let best: number | null = null;
  let worst: number | null = null;
  if (row.kind === "num" && mode === "highlight" && row.better !== "none") {
    const vals = projects
      .map((p) => row.get(p))
      .filter((v): v is number => typeof v === "number");
    if (vals.length > 1) {
      const max = Math.max(...vals);
      const min = Math.min(...vals);
      if (max !== min) {
        best = row.better === "higher" ? max : min;
        worst = row.better === "higher" ? min : max;
      }
    }
  }

  return (
    <div
      className={cn(
        "grid border-b border-[var(--border-soft)] last:border-b-0 text-xs",
        stripe && "bg-muted/20",
      )}
      style={{ gridTemplateColumns: gridTemplate(projects.length, mode) }}
    >
      <div className="px-3 py-2 text-muted-foreground flex items-center gap-1">
        <span>{row.label}</span>
        {row.kind === "num" && row.unit && (
          <span className="text-[10px] font-mono">· {row.unit}</span>
        )}
      </div>
      {projects.map((p) => {
        if (row.kind === "text") {
          return (
            <div
              key={p.id}
              className="px-3 py-2 border-l border-[var(--border-soft)] font-mono text-foreground"
            >
              {row.get(p)}
            </div>
          );
        }
        const v = row.get(p);
        const isBest = best !== null && v === best;
        const isWorst = worst !== null && v === worst;
        return (
          <div
            key={p.id}
            className={cn(
              "px-3 py-2 border-l border-[var(--border-soft)] font-mono tabular-nums",
              isBest && "bg-[var(--status-actual)]/10 text-foreground",
              isWorst && "bg-[var(--status-error)]/10 text-foreground",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span>{fmtNumber(v ?? null, row.decimals ?? 0)}</span>
              {isBest && (
                <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--status-actual)]">
                  лучшее
                </span>
              )}
              {isWorst && (
                <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--status-error)]">
                  худшее
                </span>
              )}
            </div>
          </div>
        );
      })}
      {mode === "delta" && row.kind === "num" && (
        <DeltaCell row={row} projects={projects} />
      )}
      {mode === "delta" && row.kind === "text" && (
        <div className="px-3 py-2 border-l border-[var(--border-soft)] text-muted-foreground">
          —
        </div>
      )}
    </div>
  );
}

function DeltaCell({
  row,
  projects,
}: {
  row: NumRow;
  projects: ProjectGeo[];
}) {
  const a = row.get(projects[0]);
  const b = row.get(projects[1]);
  if (typeof a !== "number" || typeof b !== "number") {
    return (
      <div className="px-3 py-2 border-l border-[var(--border-soft)] text-muted-foreground">
        —
      </div>
    );
  }
  const d = b - a;
  let tone: "neutral" | "good" | "bad" = "neutral";
  if (d !== 0 && row.better !== "none") {
    const bIsBetter =
      row.better === "higher" ? d > 0 : d < 0;
    tone = bIsBetter ? "good" : "bad";
  }
  return (
    <div
      className={cn(
        "px-3 py-2 border-l border-[var(--border-soft)] font-mono tabular-nums flex items-center gap-1.5",
        tone === "good" && "text-[var(--status-actual)]",
        tone === "bad" && "text-[var(--status-error)]",
      )}
    >
      {tone === "good" && <ArrowUpRight className="w-3 h-3" />}
      {tone === "bad" && <ArrowDownRight className="w-3 h-3" />}
      <span>{fmtDelta(d, row.decimals ?? 0)}</span>
    </div>
  );
}

function PickerList({
  scenarioProjects,
  query,
  has,
  toggle,
}: {
  scenarioProjects: ProjectGeo[];
  query: string;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scenarioProjects;
    return scenarioProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.from.toLowerCase().includes(q) ||
        p.to.toLowerCase().includes(q),
    );
  }, [scenarioProjects, query]);

  return (
    <ul className="max-h-[320px] overflow-auto py-1">
      {filtered.length === 0 ? (
        <li className="px-3 py-3 text-xs text-muted-foreground">
          Ничего не найдено.
        </li>
      ) : (
        filtered.map((p) => {
          const inSet = has(p.id);
          return (
            <li key={p.id}>
              <button
                onClick={() => toggle(p.id)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted transition-colors",
                  inSet && "bg-muted/60",
                )}
              >
                <span className="w-3.5 shrink-0 flex items-center justify-center">
                  {inSet && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  )}
                </span>
                <span
                  className="w-2 h-2 rounded-[1px] shrink-0"
                  style={{ background: TYPE_COLOR[p.type] }}
                  aria-hidden
                />
                <span className="font-medium truncate flex-1">
                  {p.name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                  {p.commissionYear}
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}