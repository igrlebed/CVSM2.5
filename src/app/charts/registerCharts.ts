import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  BarController,
  DoughnutController,
  PieController,
} from "chart.js";

let registered = false;

export function ensureChartsRegistered() {
  if (registered) return;
  Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
    BarController,
    DoughnutController,
    PieController,
  );
  Chart.defaults.font.family =
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = "rgba(15, 23, 42, 0.72)";
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.legend.labels.padding = 12;
  registered = true;
}

export const CHART_PALETTE = {
  primary: "rgba(15, 23, 42, 0.85)",
  primaryFill: "rgba(15, 23, 42, 0.10)",
  accent: "#FD853A",
  accentFill: "rgba(253, 133, 58, 0.18)",
  blue: "#6172F3",
  blueFill: "rgba(97, 114, 243, 0.18)",
  amber: "#FEC84B",
  amberFill: "rgba(254, 200, 75, 0.18)",
  green: "#12B76A",
  greenFill: "rgba(18, 183, 106, 0.18)",
  rose: "#F04438",
  roseFill: "rgba(240, 68, 56, 0.18)",
  grid: "rgba(15, 23, 42, 0.08)",
  axis: "rgba(15, 23, 42, 0.55)",
};
