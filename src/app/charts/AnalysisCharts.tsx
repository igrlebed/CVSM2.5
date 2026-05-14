import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { ensureChartsRegistered, CHART_PALETTE } from "./registerCharts";
import type { ProjectGeo } from "../map/projectsData";
import type { RankingResultRow } from "../state/RankingContext";

ensureChartsRegistered();

const TONE_CYCLE = [
  CHART_PALETTE.primary,
  CHART_PALETTE.accent,
  CHART_PALETTE.blue,
  CHART_PALETTE.amber,
  CHART_PALETTE.green,
  CHART_PALETTE.rose,
];

export function RankingScoreChart({ rows }: { rows: RankingResultRow[] }) {
  const data = useMemo(
    () => ({
      labels: rows.map((r) => r.projectName),
      datasets: [
        {
          label: "Балл TOPSIS",
          data: rows.map((r) => Number(r.score.toFixed(3))),
          backgroundColor: rows.map((_, i) => TONE_CYCLE[i % TONE_CYCLE.length]),
          borderRadius: 2,
          maxBarThickness: 22,
        },
      ],
    }),
    [rows],
  );

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 8,
        cornerRadius: 2,
        callbacks: { label: (c) => `Балл TOPSIS · ${c.parsed.x.toFixed(3)}` },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 1,
        grid: { color: CHART_PALETTE.grid, drawTicks: false },
        ticks: { color: CHART_PALETTE.axis },
      },
      y: {
        grid: { display: false },
        ticks: { color: CHART_PALETTE.axis, autoSkip: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export function CompareGroupedBarChart({
  projects,
}: {
  projects: ProjectGeo[];
}) {
  const data = useMemo(() => {
    const metrics: { key: string; label: string; pick: (p: ProjectGeo) => number }[] = [
      { key: "pax", label: "Пассажиропоток", pick: (p) => p.passengersMln },
      { key: "len", label: "Протяжённость", pick: (p) => p.lengthKm },
      { key: "inv", label: "Инвестиции", pick: (p) => p.investmentBln },
      { key: "gdp", label: "Прирост ВРП", pick: (p) => p.gdpTrln },
    ];

    return {
      labels: metrics.map((m) => m.label),
      datasets: projects.map((p, i) => {
        const color = TONE_CYCLE[i % TONE_CYCLE.length];
        return {
          label: p.name,
          data: metrics.map((m) => {
            const vals = projects.map((q) => m.pick(q));
            const max = Math.max(...vals) || 1;
            return Math.round((m.pick(p) / max) * 100);
          }),
          backgroundColor: color,
          borderRadius: 2,
          maxBarThickness: 18,
        };
      }),
    };
  }, [projects]);

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
        callbacks: { label: (c) => `${c.dataset.label} · ${c.parsed.y}% от максимума` },
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
        ticks: { color: CHART_PALETTE.axis, callback: (v) => `${v}%` },
        title: {
          display: true,
          text: "% от максимума по метрике",
          color: CHART_PALETTE.axis,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export function FinancingDrawdownChart({
  totalBln,
  startYear,
  endYear,
}: {
  totalBln: number;
  startYear: number;
  endYear: number;
}) {
  const data = useMemo(() => {
    const yrs: number[] = [];
    for (let y = startYear; y <= endYear; y++) yrs.push(y);
    const n = yrs.length;
    // Bell-shaped CAPEX deployment: low ramp-up, peak in middle, taper to launch.
    const weights = yrs.map((_, i) => {
      const t = (i + 0.5) / n;
      return Math.exp(-Math.pow((t - 0.55) / 0.28, 2));
    });
    const sumW = weights.reduce((a, b) => a + b, 0) || 1;
    const drawdown = weights.map((w) => +(totalBln * (w / sumW)).toFixed(1));
    return {
      labels: yrs.map(String),
      datasets: [
        {
          label: "Выборка CAPEX, млрд руб.",
          data: drawdown,
          backgroundColor: CHART_PALETTE.primary,
          borderRadius: 2,
          maxBarThickness: 18,
        },
      ],
    };
  }, [totalBln, startYear, endYear]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        padding: 8,
        cornerRadius: 2,
        callbacks: { label: (c) => `${c.parsed.y.toFixed(1)} млрд руб.` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: CHART_PALETTE.axis } },
      y: {
        grid: { color: CHART_PALETTE.grid, drawTicks: false },
        ticks: { color: CHART_PALETTE.axis },
        title: { display: true, text: "млрд руб.", color: CHART_PALETTE.axis },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export function DebtServiceChart({
  debtBln,
  startYear,
  endYear,
  ratePct = 8.5,
}: {
  debtBln: number;
  startYear: number;
  endYear: number;
  ratePct?: number;
}) {
  const data = useMemo(() => {
    const yrs: number[] = [];
    for (let y = startYear; y <= endYear; y++) yrs.push(y);
    const n = Math.max(yrs.length, 1);
    // Linear principal amortization + interest on remaining balance.
    const principal = +(debtBln / n).toFixed(2);
    let remaining = debtBln;
    const principalSeries: number[] = [];
    const interestSeries: number[] = [];
    for (let i = 0; i < n; i++) {
      const interest = +((remaining * ratePct) / 100).toFixed(2);
      principalSeries.push(principal);
      interestSeries.push(interest);
      remaining = Math.max(0, remaining - principal);
    }
    return {
      labels: yrs.map(String),
      datasets: [
        {
          label: "Погашение тела, млрд руб.",
          data: principalSeries,
          backgroundColor: CHART_PALETTE.primary,
          borderRadius: 2,
          stack: "ds",
          maxBarThickness: 18,
        },
        {
          label: `Проценты (${ratePct.toFixed(1).replace(".", ",")} %), млрд руб.`,
          data: interestSeries,
          backgroundColor: CHART_PALETTE.accent,
          borderRadius: 2,
          stack: "ds",
          maxBarThickness: 18,
        },
      ],
    };
  }, [debtBln, startYear, endYear, ratePct]);

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
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: CHART_PALETTE.axis },
      },
      y: {
        stacked: true,
        grid: { color: CHART_PALETTE.grid, drawTicks: false },
        ticks: { color: CHART_PALETTE.axis },
        title: { display: true, text: "млрд руб.", color: CHART_PALETTE.axis },
      },
    },
  };

  return <Bar data={data} options={options} />;
}