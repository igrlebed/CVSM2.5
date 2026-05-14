import { PROJECTS, type ProjectGeo } from "../map/projectsData";
import type { CalcStatus, ScenarioSummary } from "../types";

export type ScenarioCompareTabId = "kpi" | "diff" | "timeline";
export type ScenarioCompareKpiDirection = "higher" | "lower";
export type ScenarioDiffStatus = "Включён" | "Отсутствует";
export type ScenarioDiffTag =
  | "Удалён"
  | "Добавлен"
  | "Изменены параметры"
  | "Без изменений";

export interface ScenarioKpiSnapshot {
  npv: number;
  irr: number;
  investments: number;
  passengers: number;
  gdp: number;
  population: number;
  payback: number;
  topsis: number;
}

export interface ScenarioCompareKpiDefinition {
  id: keyof ScenarioKpiSnapshot;
  label: string;
  unit: string;
  decimals: number;
  direction: ScenarioCompareKpiDirection;
}

export interface ScenarioCompareDataset {
  scenario: ScenarioSummary;
  projects: ProjectGeo[];
  kpis: ScenarioKpiSnapshot;
}

export interface ScenarioProjectDiffRow {
  key: string;
  name: string;
  type: string;
  route: string;
  valuesByScenario: Record<string, ProjectGeo | null>;
  differenceTag: ScenarioDiffTag;
  hasDifferences: boolean;
}

export interface ScenarioTimelineRow extends ScenarioProjectDiffRow {
  launchYearsByScenario: Record<string, number | null>;
}

export interface ScenarioCompareGate {
  selectable: boolean;
  blockingReason?: string;
  warning?: string;
  needsExplicitConfirmation?: boolean;
  baselineCaution?: string;
}

export const SCENARIO_COMPARE_TABS: {
  id: ScenarioCompareTabId;
  label: string;
}[] = [
  { id: "kpi", label: "KPI" },
  { id: "diff", label: "Состав и отличия" },
  { id: "timeline", label: "Время́нный профиль" },
];

export const SCENARIO_COMPARE_KPIS: ScenarioCompareKpiDefinition[] = [
  {
    id: "npv",
    label: "NPV (ЧДД)",
    unit: "млрд ₽",
    decimals: 0,
    direction: "higher",
  },
  {
    id: "irr",
    label: "IRR (ВНД)",
    unit: "%",
    decimals: 1,
    direction: "higher",
  },
  {
    id: "investments",
    label: "Инвестиции",
    unit: "млрд ₽",
    decimals: 0,
    direction: "lower",
  },
  {
    id: "passengers",
    label: "Пассажиропоток",
    unit: "млн чел./год",
    decimals: 1,
    direction: "higher",
  },
  {
    id: "gdp",
    label: "Прирост ВВП",
    unit: "трлн ₽",
    decimals: 2,
    direction: "higher",
  },
  {
    id: "population",
    label: "Население в зоне влияния",
    unit: "млн чел.",
    decimals: 1,
    direction: "higher",
  },
  {
    id: "payback",
    label: "Срок окупаемости",
    unit: "лет",
    decimals: 1,
    direction: "lower",
  },
  {
    id: "topsis",
    label: "Рейтинговый балл TOPSIS",
    unit: "0–1",
    decimals: 3,
    direction: "higher",
  },
];

const SYSTEM_PROJECT_IDS = new Set(PROJECTS.map((project) => project.id));

export function getScenarioCompareGate(
  scenario: ScenarioSummary,
): ScenarioCompareGate {
  if (scenario.projectCount === 0) {
    return {
      selectable: false,
      blockingReason: "Сценарий не содержит проектов.",
    };
  }

  if (scenario.calcStatus === "calculation_error") {
    return {
      selectable: false,
      blockingReason: "Сценарий содержит ошибку расчёта, сопоставление невозможно.",
    };
  }

  if (scenario.calcStatus === "not_calculated") {
    return {
      selectable: false,
      blockingReason: "Сценарий не рассчитан.",
    };
  }

  if (scenario.calcStatus === "stale_after_changes") {
    return {
      selectable: true,
      warning: "Сценарий устарел после изменений. Перед сопоставлением желательно пересчитать данные.",
      needsExplicitConfirmation: true,
    };
  }

  if (scenario.calcStatus === "in_calculation") {
    return {
      selectable: true,
      warning: "Сценарий в расчёте, данные могут измениться.",
      baselineCaution: "Не рекомендуется использовать этот сценарий как базовый.",
    };
  }

  return { selectable: true };
}

export function computeScenarioKpis(projects: ProjectGeo[]): ScenarioKpiSnapshot {
  const investments = sum(projects, (project) => project.investmentBln);
  const passengers = sum(projects, (project) => project.passengersMln);
  const gdp = sum(projects, (project) => project.gdpTrln);
  const population = sum(projects, (project) => project.populationMln);

  // Prototype-only approximation based on the attributes already present in the codebase.
  const macroBenefitBln = gdp * 1000 * 1.35;
  const mobilityBenefitBln = passengers * 22;
  const accessibilityBenefitBln = population * 5;
  const npv = round(
    macroBenefitBln + mobilityBenefitBln + accessibilityBenefitBln - investments,
    0,
  );

  const annualEffectBln =
    passengers * 6 + population * 1.2 + gdp * 1000 * 0.03;
  const payback = round(
    clamp(investments / Math.max(annualEffectBln, 1), 5, 30),
    1,
  );

  const irr = round(
    clamp(6 + (macroBenefitBln + mobilityBenefitBln) / Math.max(investments, 1) * 7, 4, 24),
    1,
  );

  const topsis = round(
    weightedAverage([
      normalize(npv, -2500, 4500),
      normalize(irr, 6, 20),
      invertNormalize(investments, 2500, 11000),
      normalize(passengers, 10, 90),
      normalize(gdp, 1, 8),
      normalize(population, 5, 70),
      invertNormalize(payback, 8, 22),
    ], [0.18, 0.14, 0.12, 0.16, 0.18, 0.10, 0.12]),
    3,
  );

  return {
    npv,
    irr,
    investments: round(investments, 0),
    passengers: round(passengers, 1),
    gdp: round(gdp, 2),
    population: round(population, 1),
    payback,
    topsis,
  };
}

export function buildScenarioProjectDiffRows(
  datasets: ScenarioCompareDataset[],
  baselineId: string,
): ScenarioProjectDiffRow[] {
  const rows: ScenarioProjectDiffRow[] = [];

  datasets.forEach((dataset) => {
    dataset.projects.forEach((project) => {
      const row = rows.find((candidate) =>
        isSameScenarioProject(candidate.valuesByScenario, project),
      );
      if (row) {
        row.valuesByScenario[dataset.scenario.id] = project;
        return;
      }
      rows.push({
        key: project.id,
        name: project.name,
        type: project.type,
        route: `${project.from} — ${project.to}`,
        valuesByScenario: { [dataset.scenario.id]: project },
        differenceTag: "Без изменений",
        hasDifferences: false,
      });
    });
  });

  return rows
    .map((row) => {
      datasets.forEach((dataset) => {
        if (!(dataset.scenario.id in row.valuesByScenario)) {
          row.valuesByScenario[dataset.scenario.id] = null;
        }
      });
      const differenceTag = computeDifferenceTag(row.valuesByScenario, baselineId, datasets);
      return {
        ...row,
        differenceTag,
        hasDifferences: differenceTag !== "Без изменений",
      };
    })
    .sort((left, right) => {
      const typeCompare = left.type.localeCompare(right.type, "ru");
      if (typeCompare !== 0) return typeCompare;
      return left.name.localeCompare(right.name, "ru");
    });
}

export function buildScenarioTimelineRows(
  datasets: ScenarioCompareDataset[],
  baselineId: string,
): ScenarioTimelineRow[] {
  return buildScenarioProjectDiffRows(datasets, baselineId).map((row) => ({
    ...row,
    launchYearsByScenario: Object.fromEntries(
      Object.entries(row.valuesByScenario).map(([scenarioId, project]) => [
        scenarioId,
        project?.commissionYear ?? null,
      ]),
    ),
  }));
}

export function getDiffCellStatus(project: ProjectGeo | null): ScenarioDiffStatus {
  return project ? "Включён" : "Отсутствует";
}

export function hasKpiDifferences(
  datasets: ScenarioCompareDataset[],
  key: keyof ScenarioKpiSnapshot,
): boolean {
  if (datasets.length < 2) return false;
  const first = datasets[0].kpis[key];
  return datasets.some((dataset) => dataset.kpis[key] !== first);
}

export function hasTimelineDifferences(row: ScenarioTimelineRow): boolean {
  const values = Object.values(row.launchYearsByScenario);
  const first = values[0] ?? null;
  return values.some((value) => value !== first);
}

export function formatKpiValue(
  value: number,
  decimals: number,
): string {
  return value.toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKpiDelta(
  value: number,
  baselineValue: number,
  decimals: number,
): {
  absolute: string;
  percent: string;
  sign: "positive" | "negative" | "neutral";
} {
  const delta = round(value - baselineValue, decimals);
  const absolute = `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

  const percentDelta =
    baselineValue === 0 ? 0 : round((delta / baselineValue) * 100, 1);
  const percent = `${percentDelta > 0 ? "+" : percentDelta < 0 ? "−" : ""}${Math.abs(
    percentDelta,
  ).toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

  return {
    absolute,
    percent,
    sign:
      delta === 0 ? "neutral" : delta > 0 ? "positive" : "negative",
  };
}

export function getStatusLabel(status: CalcStatus): string {
  switch (status) {
    case "actual":
      return "Актуально";
    case "in_calculation":
      return "В расчёте";
    case "stale_after_changes":
      return "Устарело после изменений";
    case "calculation_error":
      return "Ошибка расчёта";
    case "not_calculated":
      return "Не рассчитано";
    default:
      return status;
  }
}

function computeDifferenceTag(
  valuesByScenario: Record<string, ProjectGeo | null>,
  baselineId: string,
  datasets: ScenarioCompareDataset[],
): ScenarioDiffTag {
  const baselineProject = valuesByScenario[baselineId] ?? null;
  const priorities: ScenarioDiffTag[] = [
    "Удалён",
    "Добавлен",
    "Изменены параметры",
  ];
  const found = new Set<ScenarioDiffTag>();

  datasets.forEach((dataset) => {
    if (dataset.scenario.id === baselineId) return;
    const candidate = valuesByScenario[dataset.scenario.id] ?? null;
    if (baselineProject && !candidate) {
      found.add("Удалён");
      return;
    }
    if (!baselineProject && candidate) {
      found.add("Добавлен");
      return;
    }
    if (baselineProject && candidate && hasKeyParamDifference(baselineProject, candidate)) {
      found.add("Изменены параметры");
    }
  });

  return priorities.find((tag) => found.has(tag)) ?? "Без изменений";
}

function hasKeyParamDifference(left: ProjectGeo, right: ProjectGeo): boolean {
  return (
    left.commissionYear !== right.commissionYear ||
    left.lengthKm !== right.lengthKm ||
    left.investmentBln !== right.investmentBln
  );
}

function isSameScenarioProject(
  valuesByScenario: Record<string, ProjectGeo | null>,
  project: ProjectGeo,
): boolean {
  const sample = Object.values(valuesByScenario).find(Boolean);
  if (!sample) return false;

  const sampleIsSystem = SYSTEM_PROJECT_IDS.has(sample.id);
  const projectIsSystem = SYSTEM_PROJECT_IDS.has(project.id);
  if (sampleIsSystem || projectIsSystem) {
    return sample.id === project.id;
  }

  if (
    sample.originScenarioId &&
    project.originScenarioId &&
    sample.originScenarioId === project.originScenarioId
  ) {
    return true;
  }

  const routeSimilarity = similarity(
    `${sample.from}-${sample.to}`,
    `${project.from}-${project.to}`,
  );
  const nameSimilarity = similarity(sample.name, project.name);
  return (routeSimilarity + nameSimilarity) / 2 >= 0.8;
}

function similarity(left: string, right: string): number {
  const a = normalizeToken(left);
  const b = normalizeToken(right);
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function levenshtein(left: string, right: string): number {
  const matrix = Array.from({ length: right.length + 1 }, () =>
    Array.from({ length: left.length + 1 }, () => 0),
  );

  for (let row = 0; row <= right.length; row += 1) matrix[row][0] = row;
  for (let col = 0; col <= left.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= right.length; row += 1) {
    for (let col = 1; col <= left.length; col += 1) {
      const cost = left[col - 1] === right[row - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[right.length][left.length];
}

function sum(
  projects: ProjectGeo[],
  picker: (project: ProjectGeo) => number,
): number {
  return projects.reduce((total, project) => total + picker(project), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function invertNormalize(value: number, min: number, max: number): number {
  return 1 - normalize(value, min, max);
}

function weightedAverage(values: number[], weights: number[]): number {
  const sumWeights = weights.reduce((total, weight) => total + weight, 0) || 1;
  return (
    values.reduce(
      (total, value, index) => total + value * (weights[index] ?? 0),
      0,
    ) / sumWeights
  );
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
