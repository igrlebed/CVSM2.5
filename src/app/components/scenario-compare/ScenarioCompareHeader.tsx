import { ArrowLeft, X } from "lucide-react";
import { ToolbarButton } from "../../primitives/Toolbar";
import type { ScenarioCompareDataset } from "../../lib/scenarioCompare";
import { getStatusLabel } from "../../lib/scenarioCompare";
import { cn } from "../../lib/cn";

interface Props {
  datasets: ScenarioCompareDataset[];
  baselineId: string | null;
  onlyDifferences: boolean;
  canRemove: boolean;
  onBack: () => void;
  onBaselineChange: (id: string) => void;
  onManageComposition: () => void;
  onToggleOnlyDifferences: (value: boolean) => void;
  onExport: () => void;
  onRemoveScenario: (id: string) => void;
}

export function ScenarioCompareHeader({
  datasets,
  baselineId,
  onlyDifferences,
  canRemove,
  onBack,
  onBaselineChange,
  onManageComposition,
  onToggleOnlyDifferences,
  onExport,
  onRemoveScenario,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Реестр сценариев
          </button>
          <span style={{ color: "var(--border)" }}>/</span>
          <span className="text-foreground font-medium">Сопоставление сценариев</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyDifferences}
              onChange={(event) => onToggleOnlyDifferences(event.target.checked)}
            />
            Только отличия
          </label>
          <ToolbarButton variant="outline" onClick={onManageComposition}>
            Изменить состав
          </ToolbarButton>
          <ToolbarButton variant="outline" onClick={onExport}>
            Экспорт
          </ToolbarButton>
        </div>
      </div>

      <div className="surface p-3 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground mb-1">
              Набор для сопоставления
            </div>
            <div className="text-xs text-muted-foreground">
              KPI-слой рассчитан из доступных атрибутов прототипа и нужен для сравнительного анализа наборов, а не для подмены расчётного ядра.
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Базовый сценарий</span>
            <select
              value={baselineId ?? ""}
              onChange={(event) => onBaselineChange(event.target.value)}
              className="bg-card border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs"
            >
              {datasets.map((dataset) => (
                <option key={dataset.scenario.id} value={dataset.scenario.id}>
                  {dataset.scenario.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {datasets.map((dataset) => {
            const isBaseline = baselineId === dataset.scenario.id;
            return (
              <div
                key={dataset.scenario.id}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-card text-xs max-w-full",
                  isBaseline
                    ? "border-primary/30 ring-1 ring-primary/20"
                    : "border-[var(--border-soft)]",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{dataset.scenario.name}</span>
                    {isBaseline && (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                        Базовый
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground truncate">
                    {dataset.scenario.type === "system" ? "Системный" : "Пользовательский"} ·{" "}
                    {getStatusLabel(dataset.scenario.calcStatus)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveScenario(dataset.scenario.id)}
                  disabled={!canRemove}
                  aria-label={`Удалить ${dataset.scenario.name} из набора`}
                  className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
