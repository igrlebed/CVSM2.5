import { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { ensureChartsRegistered, CHART_PALETTE } from "./registerCharts";
import type { ProjectGeo } from "../map/projectsData";

ensureChartsRegistered();

const fmtBln = (v: number) => `${v.toFixed(1).replace(".", ",")} млрд руб.`;
const fmtPct = (v: number) => `${v.toFixed(1).replace(".", ",")} %`;

function seedFrom(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function years(start: number, end: number) {
  const out: number[] = [];
  for (let y = start; y <= end; y++) out.push(y);
  return out;
}

const COMMON_OPTIONS = (titleX?: string, titleY?: string): ChartOptions<"line" | "bar"> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { position: "bottom", align: "start" },
    tooltip: { backgroundColor: "rgba(15,23,42,0.92)", padding: 8, cornerRadius: 2 },
  },
  scales: {
    x: {
      grid: { color: CHART_PALETTE.grid, drawTicks: false },
      ticks: { color: CHART_PALETTE.axis, maxRotation: 0, autoSkipPadding: 16 },
      title: titleX ? { display: true, text: titleX, color: CHART_PALETTE.axis } : undefined,
    },
    y: {
      grid: { color: CHART_PALETTE.grid, drawTicks: false },
      ticks: { color: CHART_PALETTE.axis },
      title: titleY ? { display: true, text: titleY, color: CHART_PALETTE.axis } : undefined,
    },
  },
});

/* ============================ Passenger flow ============================ */
export function PassengerFlowChart({
  project,
  scenario,
}: {
  project: ProjectGeo;
  scenario: { startYear: number; endYear: number } | null;
}) {
  const start = scenario?.startYear ?? 2025;
  const end = scenario?.endYear ?? 2050;
  const data = useMemo(() => {
    const rng = seedFrom("pax-" + project.id);
    const labels = years(start, end);
    const peak = project.passengersMln || 8;
    const launch = project.commissionYear;
    const ramp = (y: number) => {
      if (y < launch) return 0;
      const d = y - launch;
      return Math.max(0, peak * (1 - Math.exp(-d / 4)) * (0.92 + rng() * 0.16));
    };
    const businessShare = 0.42 + rng() * 0.06;
    return {
      labels,
      datasets: [
        {
          label: "Деловой сегмент",
          data: labels.map((y) => +(ramp(y) * businessShare).toFixed(2)),
          backgroundColor: CHART_PALETTE.accentFill,
          borderColor: CHART_PALETTE.accent,
          borderWidth: 1.5,
          fill: true,
          tension: 0.25,
          pointRadius: 0,
        },
        {
          label: "Туризм и личные поездки",
          data: labels.map((y) => +(ramp(y) * (1 - businessShare)).toFixed(2)),
          backgroundColor: CHART_PALETTE.blueFill,
          borderColor: CHART_PALETTE.blue,
          borderWidth: 1.5,
          fill: true,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    };
  }, [project, start, end]);

  const options = useMemo(() => {
    const o = COMMON_OPTIONS("Год", "млн чел./год") as ChartOptions<"line">;
    (o.scales as any).y.stacked = true;
    return o;
  }, []);

  return <Line data={data} options={options} />;
}

/* ============================ Cargo composition ============================ */
export function CargoCompositionChart({
  project,
  scenario,
}: {
  project: ProjectGeo;
  scenario: { startYear: number; endYear: number } | null;
}) {
  const start = scenario?.startYear ?? 2025;
  const end = scenario?.endYear ?? 2050;
  const data = useMemo(() => {
    const rng = seedFrom("cargo-" + project.id);
    const labels = years(start, end).filter((y) => y % 2 === 0);
    const launch = project.commissionYear;
    const base = Math.max(2, project.lengthKm / 90);
    const ramp = (y: number) => {
      if (y < launch) return 0;
      const d = y - launch;
      return base * (1 - Math.exp(-d / 5));
    };
    return {
      labels,
      datasets: [
        {
          label: "Контейнеры",
          data: labels.map((y) => +(ramp(y) * (0.46 + rng() * 0.04)).toFixed(2)),
          backgroundColor: CHART_PALETTE.blue,
        },
        {
          label: "Скоропорт",
          data: labels.map((y) => +(ramp(y) * (0.18 + rng() * 0.04)).toFixed(2)),
          backgroundColor: CHART_PALETTE.amber,
        },
        {
          label: "Почта и сборные",
          data: labels.map((y) => +(ramp(y) * (0.12 + rng() * 0.03)).toFixed(2)),
          backgroundColor: CHART_PALETTE.green,
        },
        {
          label: "Прочие грузы",
          data: labels.map((y) => +(ramp(y) * (0.20 + rng() * 0.04)).toFixed(2)),
          backgroundColor: CHART_PALETTE.primary,
        },
      ],
    };
  }, [project, start, end]);

  const options = useMemo(() => {
    const o = COMMON_OPTIONS("Год", "млн т / год") as ChartOptions<"bar">;
    (o.scales as any).x.stacked = true;
    (o.scales as any).y.stacked = true;
    return o;
  }, []);

  return <Bar data={data} options={options} />;
}

/* ============================ Capacity balance ============================ */
export function CapacityBalanceChart({ project }: { project: ProjectGeo }) {
  const data = useMemo(() => {
    const rng = seedFrom("cap-" + project.id);
    const labels = ["2030", "2035", "2040", "2045", "2050"];
    const required = labels.map((_, i) => 38 + i * 6 + rng() * 4);
    const designed = labels.map(() => 64 + rng() * 6);
    return {
      labels,
      datasets: [
        {
          label: "Потребная пропускная способность",
          data: required.map((v) => +v.toFixed(1)),
          backgroundColor: CHART_PALETTE.accent,
          borderRadius: 2,
        },
        {
          label: "Расчётная пропускная способность",
          data: designed.map((v) => +v.toFixed(1)),
          backgroundColor: CHART_PALETTE.blue,
          borderRadius: 2,
        },
      ],
    };
  }, [project]);

  const options = useMemo(() => COMMON_OPTIONS("Срез", "пар поездов / сутки") as ChartOptions<"bar">, []);
  return <Bar data={data} options={options} />;
}

/* ============================ FCF ============================ */
export function FcfChart({
  project,
  scenario,
}: {
  project: ProjectGeo;
  scenario: { startYear: number; endYear: number } | null;
}) {
  const start = scenario?.startYear ?? 2025;
  const end = scenario?.endYear ?? 2050;
  const data = useMemo(() => {
    const rng = seedFrom("fcf-" + project.id);
    const labels = years(start, end);
    const launch = project.commissionYear;
    const capex = project.investmentBln || 800;
    const peak = capex * 0.09;
    const series = labels.map((y) => {
      if (y < launch - 6) return 0;
      if (y < launch) return -capex * (0.10 + rng() * 0.04);
      const d = y - launch;
      return +(peak * (1 - Math.exp(-d / 4))).toFixed(1);
    });
    return {
      labels,
      datasets: [
        {
          label: "FCF, млрд руб.",
          data: series,
          borderColor: CHART_PALETTE.primary,
          backgroundColor: CHART_PALETTE.primaryFill,
          fill: true,
          tension: 0.2,
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    };
  }, [project, start, end]);
  const options = useMemo(() => COMMON_OPTIONS("Год", "млрд руб.") as ChartOptions<"line">, []);
  return <Line data={data} options={options} />;
}

/* ============================ Financing scheme (L1-16) ============================ */
export interface FinancingSource {
  label: string;
  share: number;
  amount: number;
  color: string;
  note: string;
}

export function buildFinancingSources(project: ProjectGeo): FinancingSource[] {
  const total = project.investmentBln || 1200;
  const rng = seedFrom("fin-" + project.id);
  const shares = [
    0.32 + rng() * 0.04,
    0.26 + rng() * 0.03,
    0.18 + rng() * 0.03,
    0.14 + rng() * 0.02,
  ];
  const sum = shares.reduce((a, b) => a + b, 0);
  const norm = shares.map((s) => s / sum * 0.94);
  const last = +(1 - norm.reduce((a, b) => a + b, 0)).toFixed(3);
  const final = [...norm, last];
  const meta: { label: string; color: string; note: string }[] = [
    {
      label: "Федеральный бюджет",
      color: CHART_PALETTE.accent,
      note: "Прямые бюджетные ассигнования и капгранты",
    },
    {
      label: "ФНБ и инфраструктурные облигации",
      color: CHART_PALETTE.blue,
      note: "Целевые средства Фонда национального благосостояния",
    },
    {
      label: "Собственные средства ОАО «РЖД»",
      color: CHART_PALETTE.primary,
      note: "Капитализация прибыли и амортизация",
    },
    {
      label: "Банковское проектное финансирование",
      color: CHART_PALETTE.green,
      note: "Синдицированный кредит под госгарантии",
    },
    {
      label: "Концессия и частные инвесторы",
      color: CHART_PALETTE.amber,
      note: "Концессионные платежи и частный капитал",
    },
  ];
  return meta.map((m, i) => ({
    label: m.label,
    share: +(final[i] * 100).toFixed(1),
    amount: +(final[i] * total).toFixed(0),
    color: m.color,
    note: m.note,
  }));
}

export function FinancingPieChart({ sources }: { sources: FinancingSource[] }) {
  const data = useMemo(
    () => ({
      labels: sources.map((s) => s.label),
      datasets: [
        {
          data: sources.map((s) => s.share),
          backgroundColor: sources.map((s) => s.color),
          borderColor: "rgba(255,255,255,0.85)",
          borderWidth: 1,
        },
      ],
    }),
    [sources],
  );
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        callbacks: {
          label: (ctx) => `${ctx.label}: ${fmtPct(ctx.parsed as number)}`,
        },
      },
    },
  };
  return <Doughnut data={data} options={options} />;
}

/* ============================ Sensitivity (tornado) ============================ */
export interface SensitivityFactor {
  label: string;
  low: number; // negative deviation, %
  high: number; // positive deviation, %
}

export function buildSensitivityFactors(project: ProjectGeo): SensitivityFactor[] {
  const rng = seedFrom("sens-" + project.id);
  const r = (a: number, b: number) => +(a + rng() * (b - a)).toFixed(1);
  return [
    { label: "Объём пассажиропотока", low: -r(11, 14), high: r(10, 13) },
    { label: "Тарифная политика", low: -r(7, 10), high: r(7, 10) },
    { label: "Стоимость СМР (CAPEX)", low: -r(8, 11), high: r(5, 8) },
    { label: "Дисконт-ставка", low: -r(6, 9), high: r(4, 7) },
    { label: "Сроки ввода в эксплуатацию", low: -r(5, 8), high: r(3, 6) },
    { label: "Стоимость подвижного состава", low: -r(4, 6), high: r(3, 5) },
    { label: "OPEX содержания инфраструктуры", low: -r(3, 5), high: r(2, 4) },
  ].sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
}

export function SensitivityTornadoChart({
  factors,
}: {
  factors: SensitivityFactor[];
}) {
  const data = useMemo(
    () => ({
      labels: factors.map((f) => f.label),
      datasets: [
        {
          label: "Снижение ЧДД (NPV), %",
          data: factors.map((f) => f.low),
          backgroundColor: CHART_PALETTE.roseFill,
          borderColor: CHART_PALETTE.rose,
          borderWidth: 1,
          borderRadius: 2,
        },
        {
          label: "Прирост ЧДД (NPV), %",
          data: factors.map((f) => f.high),
          backgroundColor: CHART_PALETTE.greenFill,
          borderColor: CHART_PALETTE.green,
          borderWidth: 1,
          borderRadius: 2,
        },
      ],
    }),
    [factors],
  );
  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", align: "start" },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtPct(ctx.parsed.x as number)}` },
      },
    },
    scales: {
      x: {
        grid: { color: CHART_PALETTE.grid },
        ticks: { color: CHART_PALETTE.axis, callback: (v) => `${v}%` },
        title: { display: true, text: "Отклонение ЧДД (NPV), %", color: CHART_PALETTE.axis },
      },
      y: { grid: { display: false }, ticks: { color: CHART_PALETTE.axis } },
    },
  };
  return <Bar data={data} options={options} />;
}

/* ============================ Terrain / elevation (L4-84) ============================ */
export function buildTerrainProfile(project: ProjectGeo) {
  const rng = seedFrom("terrain-" + project.id);
  const len = project.lengthKm;
  const points = 60;
  const labels: string[] = [];
  const elevation: number[] = [];
  let h = 120 + rng() * 80;
  for (let i = 0; i <= points; i++) {
    const km = Math.round((len * i) / points);
    labels.push(`${km}`);
    h += (rng() - 0.5) * 35;
    if (i === Math.round(points * 0.35)) h += 90;
    if (i === Math.round(points * 0.7)) h -= 70;
    h = Math.max(20, Math.min(420, h));
    elevation.push(Math.round(h));
  }
  return { labels, elevation };
}

export function TerrainProfileChart({
  project,
}: {
  project: ProjectGeo;
}) {
  const { labels, elevation } = useMemo(() => buildTerrainProfile(project), [project]);
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Высотный профиль трассы",
          data: elevation,
          borderColor: CHART_PALETTE.primary,
          backgroundColor: CHART_PALETTE.primaryFill,
          fill: true,
          tension: 0.35,
          borderWidth: 1.25,
          pointRadius: 0,
        },
      ],
    }),
    [labels, elevation],
  );
  const options = useMemo(() => COMMON_OPTIONS("Километраж, км", "Высота над уровнем моря, м") as ChartOptions<"line">, []);
  return <Line data={data} options={options} />;
}

export { fmtBln, fmtPct };