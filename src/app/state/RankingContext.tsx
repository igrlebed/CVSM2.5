import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RankingCriterion } from "../types";
import { useScenario } from "./ScenarioContext";

export interface RankingResultRow {
  projectId: string;
  projectName: string;
  score: number;
  sPlus: number;
  sMinus: number;
  topContribution: { criterionId: string; share: number } | null;
}

export interface RankingResult {
  rows: RankingResultRow[];
  usedCriteria: string[];
  skippedCriteria: string[];
  computedAt: string;
}

export type RankingCalcPhase =
  | "not_calculated"
  | "in_calculation"
  | "actual"
  | "stale_after_changes"
  | "calculation_error";

interface PerScenarioState {
  criteria: RankingCriterion[];
  result?: RankingResult;
  errorMessage?: string;
  phase: RankingCalcPhase;
  savedAt?: string;
}

interface RankingContextValue {
  scenarioKey: string;
  criteria: RankingCriterion[];
  setCriteria: (c: RankingCriterion[]) => void;
  setWeight: (id: string, weight: number) => void;
  normalize: () => void;
  weightSum: number;
  isValidWeightSum: boolean;
  result?: RankingResult;
  errorMessage?: string;
  phase: RankingCalcPhase;
  startCalculation: () => void;
  finishCalculation: (r: RankingResult) => void;
  failCalculation: (message: string) => void;
  markStale: () => void;
}

const Ctx = createContext<RankingContextValue | null>(null);

export function RankingProvider({ children }: { children: ReactNode }) {
  const { activeScenarioId } = useScenario();
  const scenarioKey = activeScenarioId ?? "_default";
  const [store, setStore] = useState<Record<string, PerScenarioState>>({});

  const current: PerScenarioState =
    store[scenarioKey] ?? { criteria: [], phase: "not_calculated" };

  const update = useCallback(
    (patch: Partial<PerScenarioState>) => {
      setStore((prev) => {
        const cur = prev[scenarioKey] ?? { criteria: [], phase: "not_calculated" };
        return { ...prev, [scenarioKey]: { ...cur, ...patch } };
      });
    },
    [scenarioKey],
  );

  const setCriteria = useCallback(
    (criteria: RankingCriterion[]) => update({ criteria }),
    [update],
  );

  const setWeight = useCallback(
    (id: string, weight: number) => {
      setStore((prev) => {
        const cur = prev[scenarioKey] ?? { criteria: [], phase: "not_calculated" };
        const nextCriteria = cur.criteria.map((c) =>
          c.id === id ? { ...c, weight } : c,
        );
        // Editing weights invalidates a previously computed result.
        const nextPhase: RankingCalcPhase =
          cur.phase === "actual" ? "stale_after_changes" : cur.phase;
        return {
          ...prev,
          [scenarioKey]: { ...cur, criteria: nextCriteria, phase: nextPhase },
        };
      });
    },
    [scenarioKey],
  );

  const weightSum = current.criteria.reduce((acc, c) => acc + (c.weight || 0), 0);
  const isValidWeightSum = Math.abs(weightSum - 100) < 0.05;

  const normalize = useCallback(() => {
    setStore((prev) => {
      const cur = prev[scenarioKey] ?? { criteria: [], phase: "not_calculated" };
      const sum = cur.criteria.reduce((a, c) => a + (c.weight || 0), 0);
      if (sum === 0) return prev;
      const factor = 100 / sum;
      const next = cur.criteria.map((c) => ({
        ...c,
        weight: Math.round(c.weight * factor * 10) / 10,
      }));
      // Round drift correction on the largest weight.
      const drifted = next.reduce((a, c) => a + c.weight, 0);
      const diff = Math.round((100 - drifted) * 10) / 10;
      if (diff !== 0 && next.length > 0) {
        const idx = next.reduce(
          (mi, c, i) => (c.weight > next[mi].weight ? i : mi),
          0,
        );
        next[idx] = {
          ...next[idx],
          weight: Math.round((next[idx].weight + diff) * 10) / 10,
        };
      }
      return { ...prev, [scenarioKey]: { ...cur, criteria: next } };
    });
  }, [scenarioKey]);

  const startCalculation = useCallback(
    () => update({ phase: "in_calculation", errorMessage: undefined }),
    [update],
  );
  const finishCalculation = useCallback(
    (r: RankingResult) =>
      update({
        phase: "actual",
        result: r,
        errorMessage: undefined,
        savedAt: r.computedAt,
      }),
    [update],
  );
  const failCalculation = useCallback(
    (message: string) =>
      update({ phase: "calculation_error", errorMessage: message }),
    [update],
  );
  const markStale = useCallback(() => {
    if (current.phase === "actual") update({ phase: "stale_after_changes" });
  }, [current.phase, update]);

  const value = useMemo<RankingContextValue>(
    () => ({
      scenarioKey,
      criteria: current.criteria,
      setCriteria,
      setWeight,
      normalize,
      weightSum,
      isValidWeightSum,
      result: current.result,
      errorMessage: current.errorMessage,
      phase: current.phase,
      startCalculation,
      finishCalculation,
      failCalculation,
      markStale,
    }),
    [
      scenarioKey,
      current.criteria,
      current.result,
      current.errorMessage,
      current.phase,
      setCriteria,
      setWeight,
      normalize,
      weightSum,
      isValidWeightSum,
      startCalculation,
      finishCalculation,
      failCalculation,
      markStale,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRanking() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRanking must be used inside RankingProvider");
  return v;
}

/* ---------- Helpers: compatibility with existing call sites ---------- */
// Some legacy callers used `config.criteria` shape.
export type { RankingCriterion };
