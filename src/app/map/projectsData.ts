export type ProjectType = "ВСМ" | "СМ" | "ВСМ Международный" | "ВСМ Введённый";
export type ProjectRealStatus = "introduced" | "in_development" | "draft";

export interface ProjectGeo {
  id: string;
  name: string;
  type: ProjectType;
  realStatus: ProjectRealStatus;
  originScenarioId?: string;
  commissionYear: number;
  from: string;
  to: string;
  // Schematic polyline in lon/lat
  geometry: [number, number][];
  // Per-project documented metrics
  lengthKm: number;
  investmentBln: number;
  passengersMln: number;
  gdpTrln: number;
  populationMln: number;
  fleet: number;
  protectedRoute?: boolean;
}

export const TYPE_COLOR: Record<ProjectType, string> = {
  "ВСМ": "#FD853A",
  "СМ": "#6172F3",
  "ВСМ Международный": "#FEC84B",
  "ВСМ Введённый": "#12B76A",
};

const MOSCOW: [number, number] = [37.6173, 55.7558];

// Schematic geometries — straight segments routed from Moscow to terminus,
// matching the documented system project list.
export const PROJECTS: ProjectGeo[] = [
  {
    id: "msk-spb",
    name: "ВСМ Москва — Санкт-Петербург",
    type: "ВСМ Введённый",
    realStatus: "introduced",
    commissionYear: 2028,
    from: "Москва",
    to: "Санкт-Петербург",
    geometry: [MOSCOW, [33.95, 57.85], [30.3158, 59.9343]],
    lengthKm: 679,
    investmentBln: 1740,
    passengersMln: 23.0,
    gdpTrln: 1.85,
    populationMln: 19.4,
    fleet: 28,
    protectedRoute: true,
  },
  {
    id: "msk-ekb",
    name: "ВСМ Москва — Екатеринбург",
    type: "ВСМ",
    realStatus: "in_development",
    commissionYear: 2035,
    from: "Москва",
    to: "Екатеринбург",
    geometry: [MOSCOW, [44.0, 56.32], [56.25, 58.0], [60.6122, 56.8389]],
    lengthKm: 1532,
    investmentBln: 4180,
    passengersMln: 14.6,
    gdpTrln: 1.42,
    populationMln: 11.8,
    fleet: 41,
  },
  {
    id: "msk-adler",
    name: "ВСМ Москва — Адлер",
    type: "ВСМ",
    realStatus: "in_development",
    commissionYear: 2040,
    from: "Москва",
    to: "Адлер",
    geometry: [MOSCOW, [39.7, 51.66], [39.75, 47.2], [39.7234, 43.5855]],
    lengthKm: 1540,
    investmentBln: 4310,
    passengersMln: 12.3,
    gdpTrln: 1.18,
    populationMln: 9.7,
    fleet: 38,
  },
  {
    id: "msk-minsk",
    name: "ВСМ Москва — Минск",
    type: "ВСМ Международный",
    realStatus: "draft",
    commissionYear: 2032,
    from: "Москва",
    to: "Минск",
    geometry: [MOSCOW, [33.5, 54.78], [27.5615, 53.9006]],
    lengthKm: 715,
    investmentBln: 1980,
    passengersMln: 9.1,
    gdpTrln: 0.74,
    populationMln: 7.2,
    fleet: 22,
  },
  {
    id: "msk-ryazan",
    name: "ВСМ Москва — Рязань",
    type: "ВСМ",
    realStatus: "in_development",
    commissionYear: 2030,
    from: "Москва",
    to: "Рязань",
    geometry: [MOSCOW, [39.7, 54.62]],
    lengthKm: 198,
    investmentBln: 540,
    passengersMln: 6.4,
    gdpTrln: 0.32,
    populationMln: 4.1,
    fleet: 9,
  },
  {
    id: "msk-belgorod",
    name: "СМ Москва — Белгород",
    type: "СМ",
    realStatus: "in_development",
    commissionYear: 2034,
    from: "Москва",
    to: "Белгород",
    geometry: [MOSCOW, [37.62, 52.6], [36.5856, 50.5953]],
    lengthKm: 695,
    investmentBln: 880,
    passengersMln: 5.2,
    gdpTrln: 0.41,
    populationMln: 5.6,
    fleet: 14,
  },
  {
    id: "msk-bryansk",
    name: "СМ Москва — Брянск",
    type: "СМ",
    realStatus: "draft",
    commissionYear: 2033,
    from: "Москва",
    to: "Брянск",
    geometry: [MOSCOW, [34.3658, 53.2434]],
    lengthKm: 379,
    investmentBln: 470,
    passengersMln: 3.1,
    gdpTrln: 0.21,
    populationMln: 3.4,
    fleet: 7,
  },
  {
    id: "msk-yaroslavl",
    name: "СМ Москва — Ярославль",
    type: "СМ",
    realStatus: "in_development",
    commissionYear: 2031,
    from: "Москва",
    to: "Ярославль",
    geometry: [MOSCOW, [39.8845, 57.6261]],
    lengthKm: 282,
    investmentBln: 360,
    passengersMln: 4.8,
    gdpTrln: 0.27,
    populationMln: 3.9,
    fleet: 8,
  },
];

export const STATUS_LABEL: Record<ProjectRealStatus, string> = {
  introduced: "Введён",
  in_development: "В разработке",
  draft: "Черновик",
};
