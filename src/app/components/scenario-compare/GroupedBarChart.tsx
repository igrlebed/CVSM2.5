import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { ensureChartsRegistered, CHART_PALETTE } from "../../charts/registerCharts";
import {
  formatKpiValue,
  SCENARIO_COMPARE_KPIS,
  type ScenarioCompareDataset,
} from "../../lib/scenarioCompare";

ensureChartsRegistered();

interface Props {
  datasets: ScenarioCompareDataset[];
  baselineId: string | null;
}

export function GroupedBarChart({ datasets, baselineId }: Props) {
  const data = useMemo(() => {
    return {
      labels: SCENARIO_COMPARE_KPIS.map((kpi) => kpi.label),
      datasets: datasets.map((dataset, index) => ({
        label: dataset.scenario.name,
        data: SCENARIO_COMPARE_KPIS.map((kpi) => {
          const values = datasets.map((item) => item.kpis[kpi.id]);
          const max = Math.max(...values);
          const min = Math.min(...values);
          const current = dataset.kpis[kpi.id];
          if (max === min) return 100;
          if (kpi.direction === "higher") {
            return Math.round(((current - min) / (max - min)) * 100);
          }
          return Math.round(((max - current) / (max - min)) * 100);
        }),
        backgroundColor:
          dataset.scenario.id === baselineId
            ? CHART_PALETTE.primary
            : [CHART_PALETTE.accent, CHART_PALETTE.blue, CHART_PALETTE.green, CHART_PALETTE.amber][
                index % 4
              ],
        borderRadius: 2,
        maxBarThickness: 18,
      })),
    };
  }, [datasets, baselineId]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", align: "start" },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 8,
        cornerRadius: 2,
        callbacks: {
          label: (context) => {
            const kpi = SCENARIO_COMPARE_KPIS[context.dataIndex];
            const dataset = datasets[context.datasetIndex];
            return `${dataset.scenario.name} · ${formatKpiValue(
              dataset.kpis[kpi.id],
              kpi.decimals,
            )} ${kpi.unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: CHART_PALETTE.axis },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: CHART_PALETTE.grid, drawTicks: false },
        ticks: {
          color: CHART_PALETTE.axis,
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Нормированная сравнительная оценка",
          color: CHART_PALETTE.axis,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
