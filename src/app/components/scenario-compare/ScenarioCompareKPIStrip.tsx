import { SCENARIO_COMPARE_KPIS, formatKpiDelta, formatKpiValue, type ScenarioCompareDataset } from "../../lib/scenarioCompare";
import { cn } from "../../lib/cn";

interface Props {
  datasets: ScenarioCompareDataset[];
  baselineId: string | null;
}

export function ScenarioCompareKPIStrip({ datasets, baselineId }: Props) {
  const baseline =
    datasets.find((dataset) => dataset.scenario.id === baselineId) ?? datasets[0] ?? null;

  if (!baseline) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {SCENARIO_COMPARE_KPIS.map((kpi) => {
        const sorted = [...datasets].sort((left, right) => {
          const leftValue = left.kpis[kpi.id];
          const rightValue = right.kpis[kpi.id];
          return kpi.direction === "higher"
            ? rightValue - leftValue
            : leftValue - rightValue;
        });
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        return (
          <div key={kpi.id} className="island px-4 py-3">
            <div className="text-[11px] font-medium text-muted-foreground mb-1">
              {kpi.label}
            </div>
            <div className="text-lg font-semibold tabular-nums">
              {formatKpiValue(baseline.kpis[kpi.id], kpi.decimals)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Базовый · {baseline.scenario.name}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="text-[var(--status-actual)]">
                Лучший · {best.scenario.name}
              </span>
              <span style={{ color: "var(--border)" }}>·</span>
              <span className="text-muted-foreground">Худший · {worst.scenario.name}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {datasets
                .filter((dataset) => dataset.scenario.id !== baseline.scenario.id)
                .map((dataset) => {
                  const delta = formatKpiDelta(
                    dataset.kpis[kpi.id],
                    baseline.kpis[kpi.id],
                    kpi.decimals,
                  );
                  const improved =
                    kpi.direction === "higher"
                      ? dataset.kpis[kpi.id] > baseline.kpis[kpi.id]
                      : dataset.kpis[kpi.id] < baseline.kpis[kpi.id];
                  const degraded =
                    kpi.direction === "higher"
                      ? dataset.kpis[kpi.id] < baseline.kpis[kpi.id]
                      : dataset.kpis[kpi.id] > baseline.kpis[kpi.id];
                  return (
                    <span
                      key={dataset.scenario.id}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px]",
                        improved
                          ? "bg-[var(--status-actual)]/10 text-[var(--status-actual)]"
                          : degraded
                            ? "bg-[var(--status-error)]/10 text-[var(--status-error)]"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <span className="truncate max-w-[120px]">{dataset.scenario.name}</span>
                      <span className="font-mono">
                        {delta.absolute} · {delta.percent}
                      </span>
                    </span>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
