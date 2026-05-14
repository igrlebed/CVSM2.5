import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";
import { useProjects } from "./ProjectsContext";
import { useScenario } from "./ScenarioContext";
import {
  buildScenarioTimelineRows,
  buildScenarioProjectDiffRows,
  computeScenarioKpis,
  type ScenarioCompareDataset,
  type ScenarioCompareTabId,
  type ScenarioProjectDiffRow,
  type ScenarioTimelineRow,
} from "../lib/scenarioCompare";

type ScenarioComparePhase = "loading" | "empty" | "denied" | "ready";

interface ScenarioCompareContextValue {
  phase: ScenarioComparePhase;
  scenarioIds: string[];
  baselineId: string | null;
  activeTab: ScenarioCompareTabId;
  onlyDifferences: boolean;
  datasets: ScenarioCompareDataset[];
  diffRows: ScenarioProjectDiffRow[];
  timelineRows: ScenarioTimelineRow[];
  deniedScenarioIds: string[];
  setBaselineId: (id: string) => void;
  setActiveTab: (tab: ScenarioCompareTabId) => void;
  setOnlyDifferences: (value: boolean) => void;
  setScenarioIds: (ids: string[]) => void;
  removeScenario: (id: string) => void;
}

const Ctx = createContext<ScenarioCompareContextValue | null>(null);

function parseScenarioIds(raw: string | null): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

export function ScenarioCompareProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getScenarioById } = useScenario();
  const { getScenarioProjects } = useProjects();
  const [loading, setLoading] = useState(true);

  const scenarioIds = useMemo(
    () => parseScenarioIds(searchParams.get("scenarios")),
    [searchParams],
  );

  const deniedScenarioIds = useMemo(
    () =>
      scenarioIds.filter((id) => {
        const scenario = getScenarioById(id);
        return !scenario || scenario.archived;
      }),
    [scenarioIds, getScenarioById],
  );

  const datasets = useMemo<ScenarioCompareDataset[]>(
    () =>
      scenarioIds
        .map((scenarioId) => getScenarioById(scenarioId))
        .filter((scenario): scenario is NonNullable<typeof scenario> => Boolean(scenario))
        .map((scenario) => {
          const projects = getScenarioProjects(scenario.id);
          return {
            scenario,
            projects,
            kpis: computeScenarioKpis(projects),
          };
        }),
    [scenarioIds, getScenarioById, getScenarioProjects],
  );

  const baselineId = useMemo(() => {
    const raw = searchParams.get("baseline");
    if (raw && scenarioIds.includes(raw)) return raw;
    return scenarioIds[0] ?? null;
  }, [searchParams, scenarioIds]);

  const activeTab = useMemo<ScenarioCompareTabId>(() => {
    const raw = searchParams.get("tab");
    if (raw === "diff" || raw === "timeline" || raw === "kpi") return raw;
    return "kpi";
  }, [searchParams]);

  const onlyDifferences = searchParams.get("diffs") === "1";

  const diffRows = useMemo(
    () =>
      baselineId ? buildScenarioProjectDiffRows(datasets, baselineId) : [],
    [datasets, baselineId],
  );

  const timelineRows = useMemo(
    () =>
      baselineId ? buildScenarioTimelineRows(datasets, baselineId) : [],
    [datasets, baselineId],
  );

  useEffect(() => {
    if (scenarioIds.length < 2 || deniedScenarioIds.length > 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, [scenarioIds, deniedScenarioIds]);

  const phase: ScenarioComparePhase =
    deniedScenarioIds.length > 0
      ? "denied"
      : scenarioIds.length < 2
        ? "empty"
        : loading
          ? "loading"
          : "ready";

  const updateParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next, { replace: true });
  };

  const setBaselineId = (id: string) =>
    updateParams((next) => {
      next.set("baseline", id);
    });

  const setActiveTab = (tab: ScenarioCompareTabId) =>
    updateParams((next) => {
      next.set("tab", tab);
    });

  const setOnlyDifferences = (value: boolean) =>
    updateParams((next) => {
      if (value) next.set("diffs", "1");
      else next.delete("diffs");
    });

  const setScenarioIds = (ids: string[]) =>
    updateParams((next) => {
      const normalized = Array.from(new Set(ids)).filter(Boolean).slice(0, 4);
      next.set("scenarios", normalized.join(","));
      if (!normalized.includes(baselineId ?? "")) {
        const fallback = normalized[0];
        if (fallback) next.set("baseline", fallback);
        else next.delete("baseline");
      }
    });

  const removeScenario = (id: string) =>
    updateParams((next) => {
      const nextScenarioIds = scenarioIds.filter((scenarioId) => scenarioId !== id);
      next.set("scenarios", nextScenarioIds.join(","));
      if (baselineId === id) {
        const fallback = nextScenarioIds[0];
        if (fallback) next.set("baseline", fallback);
        else next.delete("baseline");
      }
    });

  const value = useMemo<ScenarioCompareContextValue>(
    () => ({
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
    }),
    [
      phase,
      scenarioIds,
      baselineId,
      activeTab,
      onlyDifferences,
      datasets,
      diffRows,
      timelineRows,
      deniedScenarioIds,
      setScenarioIds,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenarioCompare() {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useScenarioCompare must be used inside ScenarioCompareProvider");
  }
  return value;
}
