import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GitCompareArrows,
  X,
  RefreshCcw,
  Lock,
} from "lucide-react";
import { SectionHeader } from "../primitives/SectionHeader";
import { EmptyState, ErrorState, LoadingState } from "../primitives/States";
import { ToolbarButton } from "../primitives/Toolbar";
import { useScenario } from "../state/ScenarioContext";
import { useProjects } from "../state/ProjectsContext";
import { useCompare } from "../state/CompareContext";
import {
  STATUS_LABEL,
  TYPE_COLOR,
  type ProjectGeo,
  type ProjectType,
} from "../map/projectsData";
import { cn } from "../lib/cn";

type SortKey =
  | "name"
  | "type"
  | "origin"
  | "lengthKm"
  | "commissionYear"
  | "investmentBln"
  | "passengersMln"
  | "gdpTrln";
type SortDir = "asc" | "desc";
type LoadState = "loading" | "ready" | "empty" | "error";

const ALL_TYPES: ProjectType[] = [
  "ВСМ",
  "СМ",
  "ВСМ Международный",
  "ВСМ Введённый",
];

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

export function ProjectsScreen() {
  const navigate = useNavigate();
  const { activeScenario } = useScenario();
  const { getScenarioProjects, isCustom } = useProjects();
  const compare = useCompare();

  const scenarioProjects = useMemo(
    () => getScenarioProjects(activeScenario?.id ?? null),
    [getScenarioProjects, activeScenario?.id],
  );

  const startYear = activeScenario?.startYear ?? 2025;
  const endYear = activeScenario?.endYear ?? 2050;

  const [loadState, setLoadState] = useState<LoadState>("loading");
  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 220);
    return () => clearTimeout(t);
  }, [activeScenario?.id]);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProjectType[]>(ALL_TYPES);
  const [originFilter, setOriginFilter] = useState<"all" | "system" | "custom">(
    "all",
  );
  const [yearFrom, setYearFrom] = useState<string>("");
  const [yearTo, setYearTo] = useState<string>("");
  const [invFrom, setInvFrom] = useState<string>("");
  const [invTo, setInvTo] = useState<string>("");

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset selection when scenario changes.
  useEffect(() => {
    setSelected(new Set());
  }, [activeScenario?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const yFrom = yearFrom ? Number(yearFrom) : null;
    const yTo = yearTo ? Number(yearTo) : null;
    const iFrom = invFrom ? Number(invFrom) : null;
    const iTo = invTo ? Number(invTo) : null;

    return scenarioProjects.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (!typeFilter.includes(p.type)) return false;

      const isSystem = SYSTEM_IDS.has(p.id);
      if (originFilter === "system" && !isSystem) return false;
      if (originFilter === "custom" && isSystem) return false;

      if (yFrom !== null && p.commissionYear < yFrom) return false;
      if (yTo !== null && p.commissionYear > yTo) return false;
      if (iFrom !== null && p.investmentBln < iFrom) return false;
      if (iTo !== null && p.investmentBln > iTo) return false;
      return true;
    });
  }, [
    scenarioProjects,
    query,
    typeFilter,
    originFilter,
    yearFrom,
    yearTo,
    invFrom,
    invTo,
  ]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => cmp(a, b, sortKey, sortDir));
    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleType = (t: ProjectType) =>
    setTypeFilter((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const onSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const allSelectedOnPage =
    sorted.length > 0 && sorted.every((p) => selected.has(p.id));
  const someSelectedOnPage =
    !allSelectedOnPage && sorted.some((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        sorted.forEach((p) => next.delete(p.id));
      } else {
        sorted.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtersDirty =
    query.trim().length > 0 ||
    typeFilter.length !== ALL_TYPES.length ||
    originFilter !== "all" ||
    yearFrom !== "" ||
    yearTo !== "" ||
    invFrom !== "" ||
    invTo !== "";

  const resetFilters = () => {
    setQuery("");
    setTypeFilter(ALL_TYPES);
    setOriginFilter("all");
    setYearFrom("");
    setYearTo("");
    setInvFrom("");
    setInvTo("");
  };

  const goCompare = () => {
    if (selected.size < 2) return;
    compare.clear();
    selected.forEach((id) => compare.add(id));
    navigate("/compare");
  };

  const totalScenario = scenarioProjects.length;
  const noActiveScenario = !activeScenario;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
    <div
      className="sticky top-0 z-20 bg-card px-6 pt-5 pb-3 space-y-3"
      style={{ borderBottom: "1px solid var(--border-soft)", boxShadow: "0 2px 8px rgba(14,21,35,0.03)" }}
    >
      <SectionHeader
        eyebrow="Раздел / Проекты"
        title="Список проектов сценария"
        subtitle={
          activeScenario
            ? `Сценарий «${activeScenario.name}»: ${totalScenario} проект(ов).`
            : "Сценарий не выбран. Откройте сценарий из реестра."
        }
        actions={
          <ToolbarButton variant="outline" disabled={sorted.length === 0}>
            <Download className="w-3.5 h-3.5" />
            Экспорт XLSX
          </ToolbarButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию проекта"
            className="w-full bg-card rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring border border-border"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] font-mono text-muted-foreground">Тип</span>
          {ALL_TYPES.map((t) => {
            const on = typeFilter.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm text-[10px] font-medium transition-colors",
                  on
                    ? "bg-card text-foreground border-[var(--border-soft)]"
                    : "text-muted-foreground border-[var(--border-soft)]/60 hover:bg-muted",
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

        <div className="inline-flex surface p-1 gap-0.5">
          {(
            [
              ["all", "Все"],
              ["system", "Утверждённые"],
              ["custom", "Добавленные"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setOriginFilter(k)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md transition-all",
                originFilter === k
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <RangeFilter
          label="Год запуска"
          from={yearFrom}
          to={yearTo}
          placeholderFrom={String(startYear)}
          placeholderTo={String(endYear)}
          onFrom={setYearFrom}
          onTo={setYearTo}
          inputMode="numeric"
        />

        <RangeFilter
          label="Инвестиции, млрд руб."
          from={invFrom}
          to={invTo}
          placeholderFrom="0"
          placeholderTo="∞"
          onFrom={setInvFrom}
          onTo={setInvTo}
          inputMode="decimal"
        />

        {filtersDirty && (
          <button
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>

    <div className="flex-1 min-h-0 overflow-auto px-6 py-4 space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 border border-[var(--border-soft)] bg-muted/40 rounded-sm">
          <GitCompareArrows className="w-4 h-4 text-foreground shrink-0" />
          <div className="text-xs">
            Выбрано:{" "}
            <span className="font-mono tabular-nums">{selected.size}</span> проект(ов)
            для сравнения
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Очистить
          </button>
          <ToolbarButton
            variant="solid"
            className="ml-auto"
            disabled={selected.size < 2}
            onClick={goCompare}
            title={
              selected.size < 2 ? "Выберите минимум 2 проекта" : undefined
            }
          >
            Перейти в сравнение
            <span className="font-mono tabular-nums">({selected.size})</span>
          </ToolbarButton>
        </div>
      )}

      <div className="surface overflow-hidden">
        {noActiveScenario ? (
          <EmptyState
            title="Сценарий не выбран"
            description="Откройте сценарий из реестра, чтобы увидеть состав проектов."
            action={
              <ToolbarButton variant="outline" onClick={() => navigate("/")}>
                В реестр сценариев
              </ToolbarButton>
            }
          />
        ) : loadState === "loading" ? (
          <LoadingState label="Загрузка списка проектов" />
        ) : loadState === "error" ? (
          <ErrorState
            message="Не удалось загрузить список проектов."
            onRetry={() => {
              setLoadState("loading");
              setTimeout(() => setLoadState("ready"), 220);
            }}
          />
        ) : totalScenario === 0 ? (
          <EmptyState
            title="В сценарии нет проектов"
            description="Добавьте первый проект из карты сети."
            action={
              <ToolbarButton variant="outline" onClick={() => navigate("/map")}>
                Открыть карту
              </ToolbarButton>
            }
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="Нет проектов под фильтры"
            description="Попробуйте изменить условия поиска или сбросить фильтры."
            action={
              filtersDirty ? (
                <ToolbarButton variant="outline" onClick={resetFilters}>
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Сбросить фильтры
                </ToolbarButton>
              ) : null
            }
          />
        ) : (
          <div className="overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-[var(--border-soft)]">
                  <th className="w-[36px] px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      aria-label="Выбрать все"
                      checked={allSelectedOnPage}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelectedOnPage;
                      }}
                      onChange={toggleAll}
                      className="accent-[var(--accent)]"
                    />
                  </th>
                  <Th label="Наименоание" k="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                  <Th label="Тип" k="type" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="160px" />
                  <Th label="Происхождение" k="origin" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="160px" />
                  <Th label="Статус" width="140px" />
                  <Th label="Маршрут" width="220px" />
                  <Th label="Протяжённость, км" k="lengthKm" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="150px" align="right" />
                  <Th label="Год запуска" k="commissionYear" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="120px" align="right" />
                  <Th label="Инвестиции, млрд руб." k="investmentBln" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="160px" align="right" />
                  <Th label="Пассажиропоток, млн/год" k="passengersMln" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="180px" align="right" />
                  <Th label="ВВП, трлн руб." k="gdpTrln" sortKey={sortKey} sortDir={sortDir} onSort={onSort} width="130px" align="right" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const isChecked = selected.has(p.id);
                  const isSystem =
                    SYSTEM_IDS.has(p.id) ||
                    !isCustom(activeScenario?.id ?? null, p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("input,button"))
                          return;
                        navigate(`/projects/${p.id}`);
                      }}
                      className={cn(
                        "border-b border-[var(--border-soft)] last:border-b-0 cursor-pointer transition-colors",
                        isChecked ? "bg-muted/40" : "hover:bg-muted/30",
                      )}
                    >
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Выбрать ${p.name}`}
                          checked={isChecked}
                          onChange={() => toggleOne(p.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[var(--accent)]"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            aria-hidden
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLOR[p.type] }}
                          />
                          <span className="font-medium truncate">{p.name}</span>
                          {p.id === "msk-spb" && (
                            <span
                              title="Особый статус: всегда отображается, не редактируется"
                              className="inline-flex items-center justify-center w-4 h-4 text-muted-foreground"
                            >
                              <Lock className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <TypeBadge type={p.type} />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <OriginBadge isSystem={isSystem} />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <StatusBadge status={p.realStatus} />
                      </td>
                      <td className="px-3 py-2 align-middle text-muted-foreground truncate">
                        <span className="text-foreground">{p.from}</span>
                        <span className="mx-1">→</span>
                        <span className="text-foreground">{p.to}</span>
                      </td>
                      <td className="px-3 py-2 align-middle text-right font-mono tabular-nums">
                        {p.lengthKm.toLocaleString("ru-RU")}
                      </td>
                      <td className="px-3 py-2 align-middle text-right font-mono tabular-nums">
                        {p.commissionYear}
                      </td>
                      <td className="px-3 py-2 align-middle text-right font-mono tabular-nums">
                        {p.investmentBln > 0
                          ? p.investmentBln.toLocaleString("ru-RU")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right font-mono tabular-nums">
                        {p.passengersMln > 0
                          ? p.passengersMln.toFixed(1).replace(".", ",")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 align-middle text-right font-mono tabular-nums">
                        {p.gdpTrln > 0
                          ? p.gdpTrln.toFixed(2).replace(".", ",")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loadState === "ready" && sorted.length > 0 && (
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          <span>
            Показано <span className="text-foreground">{sorted.length}</span> из{" "}
            <span className="text-foreground">{totalScenario}</span>
          </span>
          <span>
            Сортировка:{" "}
            <span className="text-foreground">{SORT_LABEL[sortKey]}</span>{" "}
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        </div>
      )}
    </div>
    </div>
  );
}

const SORT_LABEL: Record<SortKey, string> = {
  name: "Наименование",
  type: "Тип",
  origin: "Происхождение",
  lengthKm: "Протяжённость",
  commissionYear: "Год запуска",
  investmentBln: "Инвестиции",
  passengersMln: "Пассажиропоток",
  gdpTrln: "ВВП",
};

function cmp(
  a: ProjectGeo,
  b: ProjectGeo,
  key: SortKey,
  dir: SortDir,
): number {
  const sign = dir === "asc" ? 1 : -1;
  const va = projectVal(a, key);
  const vb = projectVal(b, key);
  if (typeof va === "number" && typeof vb === "number") return (va - vb) * sign;
  return String(va).localeCompare(String(vb), "ru") * sign;
}

function projectVal(p: ProjectGeo, key: SortKey): number | string {
  switch (key) {
    case "name":
      return p.name;
    case "type":
      return p.type;
    case "origin":
      return SYSTEM_IDS.has(p.id) ? 0 : 1;
    case "lengthKm":
      return p.lengthKm;
    case "commissionYear":
      return p.commissionYear;
    case "investmentBln":
      return p.investmentBln;
    case "passengersMln":
      return p.passengersMln;
    case "gdpTrln":
      return p.gdpTrln;
  }
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  width,
  align = "left",
}: {
  label: string;
  k?: SortKey;
  sortKey?: SortKey;
  sortDir?: SortDir;
  onSort?: (k: SortKey) => void;
  width?: string;
  align?: "left" | "right" | "center";
}) {
  const sortable = !!k && !!onSort;
  const active = k && sortKey === k;
  return (
    <th
      style={{ width }}
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground px-3 py-2",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort!(k!)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground transition-colors",
            align === "right" && "flex-row-reverse",
            active && "text-foreground",
          )}
        >
          <span>{label}</span>
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          )}
        </button>
      ) : (
        <span>{label}</span>
      )}
    </th>
  );
}

function RangeFilter({
  label,
  from,
  to,
  placeholderFrom,
  placeholderTo,
  onFrom,
  onTo,
  inputMode,
}: {
  label: string;
  from: string;
  to: string;
  placeholderFrom: string;
  placeholderTo: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  inputMode: "numeric" | "decimal";
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </span>
      <input
        value={from}
        onChange={(e) =>
          onFrom(
            inputMode === "numeric"
              ? e.target.value.replace(/[^\d]/g, "")
              : e.target.value.replace(/[^\d.,]/g, ""),
          )
        }
        placeholder={placeholderFrom}
        inputMode={inputMode}
        className="w-20 bg-card border border-[var(--border-soft)] rounded-md px-2 py-1 text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-muted-foreground text-xs">–</span>
      <input
        value={to}
        onChange={(e) =>
          onTo(
            inputMode === "numeric"
              ? e.target.value.replace(/[^\d]/g, "")
              : e.target.value.replace(/[^\d.,]/g, ""),
          )
        }
        placeholder={placeholderTo}
        inputMode={inputMode}
        className="w-20 bg-card border border-[var(--border-soft)] rounded-md px-2 py-1 text-xs font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function TypeBadge({ type }: { type: ProjectType }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border border-[var(--border-soft)] text-[10px] font-medium">
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: TYPE_COLOR[type] }}
      />
      {type}
    </span>
  );
}

function OriginBadge({ isSystem }: { isSystem: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium",
        isSystem
          ? "bg-primary/8 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {isSystem ? "Утверждённый" : "Добавленный"}
    </span>
  );
}

function StatusBadge({ status }: { status: ProjectGeo["realStatus"] }) {
  const map: Record<ProjectGeo["realStatus"], string> = {
    introduced: "bg-[var(--status-actual)]/10 text-[var(--status-actual)]",
    in_development: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium",
        map[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}