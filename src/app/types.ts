export type ScenarioType = "system" | "user";
export type AccountMode = "demo" | "working";
export type CalcStatus =
  | "not_calculated"
  | "in_calculation"
  | "actual"
  | "stale_after_changes"
  | "calculation_error";

export interface ScenarioSummary {
  id: string;
  name: string;
  description?: string;
  type: ScenarioType;
  projectCount: number;
  sourceScenarioId?: string;
  startYear: number;
  endYear: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  archivedAt?: string;
  calcStatus: CalcStatus;
}

export interface ProjectSummary {
  id: string;
  name: string;
  type: string;
  origin: "system" | "manual";
  lengthKm?: number;
  startYear?: number;
  endYear?: number;
  calcStatus: CalcStatus;
}

export interface RankingCriterion {
  id: string;
  label: string;
  weight: number;
  direction: "max" | "min";
}

export interface RankingConfig {
  criteria: RankingCriterion[];
  savedAt?: string;
}

export type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready" };

export type ExportFormat = "xlsx" | "pdf" | "png";

export interface ExportContextSnapshot {
  sourceModule:
    | "map"
    | "projects"
    | "project_card"
    | "compare"
    | "ranking"
    | "scenario_compare";
  scenarioId: string | null;
  filters?: Record<string, unknown>;
  selection?: string[];
}
