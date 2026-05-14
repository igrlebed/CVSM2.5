import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AccountMode, CalcStatus, ScenarioSummary } from "../types";

interface ScenarioContextValue {
  accountMode: AccountMode;
  activeScenarioId: string | null;
  activeScenario: ScenarioSummary | null;
  setActiveScenario: (id: string | null) => void;
  scenarios: ScenarioSummary[];
  getScenarioById: (id: string | null) => ScenarioSummary | null;
  getScenarioProjectIds: (id: string | null) => string[];
  setScenarioProjectCount: (id: string, count: number) => void;
  archiveScenario: (id: string) => void;
  restoreScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  createScenario: (input: CreateScenarioInput) => string;
  copyScenario: (sourceId: string) => string | null;
  setCalcStatus: (id: string, status: CalcStatus) => void;
}

export interface CreateScenarioInput {
  name: string;
  description?: string;
  startYear: number;
  endYear: number;
  projectIds: string[];
}

export const SYSTEM_PROJECTS: {
  id: string;
  name: string;
  type: "ВСМ" | "СМ" | "ВСМ Международный" | "ВСМ Введённый";
}[] = [
  { id: "msk-spb", name: "ВСМ Москва — Санкт-Петербург", type: "ВСМ Введённый" },
  { id: "msk-ekb", name: "ВСМ Москва — Екатеринбург", type: "ВСМ" },
  { id: "msk-adler", name: "ВСМ Москва — Адлер", type: "ВСМ" },
  { id: "msk-minsk", name: "ВСМ Москва — Минск", type: "ВСМ Международный" },
  { id: "msk-ryazan", name: "ВСМ Москва — Рязань", type: "ВСМ" },
  { id: "msk-belgorod", name: "СМ Москва — Белгород", type: "СМ" },
  { id: "msk-bryansk", name: "СМ Москва — Брянск", type: "СМ" },
  { id: "msk-yaroslavl", name: "СМ Москва — Ярославль", type: "СМ" },
];

const DEFAULT_SYSTEM_PROJECT_IDS = SYSTEM_PROJECTS.map((project) => project.id);

const SEED_PROJECTS: Record<string, string[]> = {
  approved: [...DEFAULT_SYSTEM_PROJECT_IDS],
  base: [...DEFAULT_SYSTEM_PROJECT_IDS],
  optimistic: [...DEFAULT_SYSTEM_PROJECT_IDS],
  realistic: [
    "msk-spb",
    "msk-ekb",
    "msk-adler",
    "msk-ryazan",
    "msk-belgorod",
    "msk-bryansk",
    "msk-yaroslavl",
  ],
  pessimistic: [
    "msk-spb",
    "msk-ryazan",
    "msk-belgorod",
    "msk-bryansk",
    "msk-yaroslavl",
  ],
  north: [
    "msk-spb",
    "msk-ekb",
    "msk-minsk",
    "msk-ryazan",
    "msk-bryansk",
    "msk-yaroslavl",
  ],
  south: [
    "msk-spb",
    "msk-adler",
    "msk-ryazan",
    "msk-belgorod",
    "msk-bryansk",
  ],
  extended: [...DEFAULT_SYSTEM_PROJECT_IDS],
  "draft-2025": [
    "msk-spb",
    "msk-ryazan",
    "msk-belgorod",
    "msk-yaroslavl",
  ],
  "freight-only": [
    "msk-spb",
    "msk-ekb",
    "msk-ryazan",
    "msk-belgorod",
    "msk-bryansk",
    "msk-yaroslavl",
  ],
  "low-cost": [
    "msk-spb",
    "msk-ryazan",
    "msk-yaroslavl",
  ],
};

const SEED_META: Array<Omit<ScenarioSummary, "projectCount">> = [
  {
    id: "approved",
    name: "Утверждённый",
    description: "Эталонный утверждённый сценарий развития сети.",
    type: "system",
    startYear: 2025,
    endYear: 2050,
    author: "Система",
    createdAt: "2026-01-15",
    updatedAt: "2026-04-22",
    calcStatus: "actual",
  },
  {
    id: "base",
    name: "Базовый сценарий",
    type: "user",
    sourceScenarioId: "approved",
    startYear: 2025,
    endYear: 2050,
    author: "А. Иванов",
    createdAt: "2026-02-03",
    updatedAt: "2026-04-28",
    calcStatus: "actual",
  },
  {
    id: "optimistic",
    name: "Оптимистичный сюжет",
    type: "user",
    sourceScenarioId: "base",
    startYear: 2025,
    endYear: 2050,
    author: "А. Иванов",
    createdAt: "2026-02-12",
    updatedAt: "2026-04-29",
    calcStatus: "stale_after_changes",
  },
  {
    id: "realistic",
    name: "Реалистичный сюжет",
    type: "user",
    sourceScenarioId: "base",
    startYear: 2025,
    endYear: 2050,
    author: "Е. Соколова",
    createdAt: "2026-02-18",
    updatedAt: "2026-05-01",
    calcStatus: "actual",
  },
  {
    id: "pessimistic",
    name: "Пессимистичный сюжет",
    type: "user",
    sourceScenarioId: "realistic",
    startYear: 2025,
    endYear: 2050,
    author: "Е. Соколова",
    createdAt: "2026-02-20",
    updatedAt: "2026-05-02",
    calcStatus: "in_calculation",
  },
  {
    id: "north",
    name: "Альтернатива — северное направление",
    type: "user",
    sourceScenarioId: "approved",
    startYear: 2025,
    endYear: 2050,
    author: "Д. Орлов",
    createdAt: "2026-03-04",
    updatedAt: "2026-04-30",
    calcStatus: "actual",
  },
  {
    id: "south",
    name: "Альтернатива — южное направление",
    type: "user",
    sourceScenarioId: "approved",
    startYear: 2025,
    endYear: 2050,
    author: "Д. Орлов",
    createdAt: "2026-03-06",
    updatedAt: "2026-04-30",
    calcStatus: "calculation_error",
  },
  {
    id: "extended",
    name: "Расширенный горизонт",
    type: "user",
    sourceScenarioId: "base",
    startYear: 2025,
    endYear: 2060,
    author: "А. Иванов",
    createdAt: "2026-03-22",
    updatedAt: "2026-05-04",
    calcStatus: "not_calculated",
  },
  {
    id: "draft-2025",
    name: "Черновик — обновление 2025",
    type: "user",
    sourceScenarioId: "base",
    startYear: 2025,
    endYear: 2045,
    author: "А. Иванов",
    createdAt: "2025-11-08",
    updatedAt: "2026-01-17",
    archived: true,
    archivedAt: "2026-02-04",
    calcStatus: "stale_after_changes",
  },
  {
    id: "freight-only",
    name: "Грузовой акцент — итерация 1",
    type: "user",
    sourceScenarioId: "base",
    startYear: 2025,
    endYear: 2050,
    author: "Е. Соколова",
    createdAt: "2025-12-12",
    updatedAt: "2026-02-21",
    archived: true,
    archivedAt: "2026-03-12",
    calcStatus: "actual",
  },
  {
    id: "low-cost",
    name: "Сценарий пониженных капитальных затрат",
    type: "user",
    sourceScenarioId: "approved",
    startYear: 2025,
    endYear: 2040,
    author: "Д. Орлов",
    createdAt: "2026-01-04",
    updatedAt: "2026-02-28",
    archived: true,
    archivedAt: "2026-04-02",
    calcStatus: "calculation_error",
  },
];

const SEED: ScenarioSummary[] = SEED_META.map((scenario) => ({
  ...scenario,
  projectCount: (SEED_PROJECTS[scenario.id] ?? []).length,
}));

const Ctx = createContext<ScenarioContextValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [accountMode] = useState<AccountMode>("working");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>(SEED);
  const [scenarioProjectIds, setScenarioProjectIds] = useState<Record<string, string[]>>(
    SEED_PROJECTS,
  );

  const activeScenario =
    scenarios.find((scenario) => scenario.id === activeScenarioId) ?? null;

  const today = () => new Date().toISOString().slice(0, 10);

  const getScenarioById = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return scenarios.find((scenario) => scenario.id === id) ?? null;
    },
    [scenarios],
  );

  const getScenarioProjectIds = useCallback(
    (id: string | null) => {
      if (!id) return DEFAULT_SYSTEM_PROJECT_IDS;
      return scenarioProjectIds[id] ?? DEFAULT_SYSTEM_PROJECT_IDS;
    },
    [scenarioProjectIds],
  );

  const setScenarioProjectCount = useCallback((id: string, count: number) => {
    setScenarios((prev) => {
      let changed = false;
      const next = prev.map((scenario) => {
        if (scenario.id !== id || scenario.projectCount === count) return scenario;
        changed = true;
        return { ...scenario, projectCount: count };
      });
      return changed ? next : prev;
    });
  }, []);

  const archiveScenario = (id: string) =>
    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.id === id && scenario.type === "user"
          ? { ...scenario, archived: true, archivedAt: today(), updatedAt: today() }
          : scenario,
      ),
    );

  const restoreScenario = (id: string) =>
    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.id === id
          ? { ...scenario, archived: false, archivedAt: undefined, updatedAt: today() }
          : scenario,
      ),
    );

  const deleteScenario = (id: string) => {
    setScenarios((prev) =>
      prev.filter((scenario) => !(scenario.id === id && scenario.archived)),
    );
    setScenarioProjectIds((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const createScenario = (input: CreateScenarioInput): string => {
    const id = `user-${Date.now().toString(36)}`;
    const now = today();
    setScenarioProjectIds((prev) => ({ ...prev, [id]: [...input.projectIds] }));
    setScenarios((prev) => [
      {
        id,
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        type: "user",
        projectCount: input.projectIds.length,
        startYear: input.startYear,
        endYear: input.endYear,
        author: "Текущий пользователь",
        createdAt: now,
        updatedAt: now,
        calcStatus: "in_calculation",
      },
      ...prev,
    ]);
    return id;
  };

  const copyScenario = (sourceId: string): string | null => {
    const source = scenarios.find((scenario) => scenario.id === sourceId);
    if (!source) return null;
    const id = `user-${Date.now().toString(36)}`;
    const now = today();
    const nextProjectIds = [...getScenarioProjectIds(sourceId)];
    setScenarioProjectIds((prev) => ({ ...prev, [id]: nextProjectIds }));
    setScenarios((prev) => [
      {
        id,
        name: `${source.name} (копия)`,
        description: source.description,
        type: "user",
        projectCount: nextProjectIds.length,
        sourceScenarioId: source.id,
        startYear: source.startYear,
        endYear: source.endYear,
        author: "Текущий пользователь",
        createdAt: now,
        updatedAt: now,
        calcStatus: source.calcStatus,
      },
      ...prev,
    ]);
    return id;
  };

  const setCalcStatus = (id: string, status: CalcStatus) =>
    setScenarios((prev) =>
      prev.map((scenario) =>
        scenario.id === id
          ? { ...scenario, calcStatus: status, updatedAt: today() }
          : scenario,
      ),
    );

  const value = useMemo<ScenarioContextValue>(
    () => ({
      accountMode,
      activeScenarioId,
      activeScenario,
      setActiveScenario: setActiveScenarioId,
      scenarios,
      getScenarioById,
      getScenarioProjectIds,
      setScenarioProjectCount,
      archiveScenario,
      restoreScenario,
      deleteScenario,
      createScenario,
      copyScenario,
      setCalcStatus,
    }),
    [
      accountMode,
      activeScenarioId,
      activeScenario,
      scenarios,
      getScenarioById,
      getScenarioProjectIds,
      setScenarioProjectCount,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScenario() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useScenario must be used inside ScenarioProvider");
  return value;
}
