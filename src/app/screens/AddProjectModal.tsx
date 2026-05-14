import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Pencil,
  Hand,
  AlertTriangle,
  CheckCircle2,
  FileJson,
} from "lucide-react";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { useProjects } from "../state/ProjectsContext";
import { TYPE_COLOR, type ProjectGeo, type ProjectType } from "../map/projectsData";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";

type Mode = "import" | "manual";

interface Props {
  open: boolean;
  scenario: ScenarioSummary | null;
  onOpenChange: (open: boolean) => void;
  onAdded?: (project: ProjectGeo) => void;
}

const TYPE_OPTIONS: ProjectType[] = [
  "ВСМ",
  "СМ",
  "ВСМ Международный",
  "ВСМ Введённый",
];

export function AddProjectModal({ open, scenario, onOpenChange, onAdded }: Props) {
  const { addProject } = useProjects();

  const [mode, setMode] = useState<Mode>("import");
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("ВСМ");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [year, setYear] = useState<string>("");
  const [lengthKm, setLengthKm] = useState<string>("");
  const [coordsText, setCoordsText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileGeometry, setFileGeometry] = useState<[number, number][] | null>(
    null,
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startYear = scenario?.startYear ?? 2025;
  const endYear = scenario?.endYear ?? 2050;

  const reset = () => {
    setMode("import");
    setName("");
    setType("ВСМ");
    setFrom("");
    setTo("");
    setYear("");
    setLengthKm("");
    setCoordsText("");
    setFileName(null);
    setFileGeometry(null);
    setFileError(null);
    setTouched(false);
    setSubmitting(false);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const parsedManualGeometry = useMemo<
    [number, number][] | null
  >(() => {
    if (mode !== "manual") return null;
    const lines = coordsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return null;
    const out: [number, number][] = [];
    for (const line of lines) {
      const parts = line.split(/[,\s;]+/).filter(Boolean);
      if (parts.length < 2) return null;
      const lat = Number(parts[0].replace(",", "."));
      const lon = Number(parts[1].replace(",", "."));
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        return null;
      }
      out.push([lon, lat]);
    }
    return out;
  }, [coordsText, mode]);

  const geometry = mode === "import" ? fileGeometry : parsedManualGeometry;

  const yearNum = Number(year);
  const lenNum = Number(lengthKm);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "Минимум 3 символа.";
    if (!from.trim()) e.from = "Укажите начальный пункт.";
    if (!to.trim()) e.to = "Укажите конечный пункт.";
    if (!Number.isFinite(yearNum)) e.year = "Год запуска обязателен.";
    else if (yearNum < startYear || yearNum > endYear)
      e.year = `Год вне горизонта сценария (${startYear}–${endYear}).`;
    if (!Number.isFinite(lenNum) || lenNum <= 0)
      e.lengthKm = "Протяжённость должна быть больше 0.";
    if (mode === "import" && !fileGeometry)
      e.geometry = fileError ?? "Загрузите файл с геометрией маршрута.";
    if (mode === "manual" && !parsedManualGeometry)
      e.geometry =
        "Укажите минимум 2 координаты в формате «широта, долгота» по строкам.";
    return e;
  }, [
    name,
    from,
    to,
    yearNum,
    lenNum,
    startYear,
    endYear,
    mode,
    fileGeometry,
    parsedManualGeometry,
    fileError,
  ]);

  const valid = Object.keys(errors).length === 0;

  const onFile = (file: File) => {
    setFileName(file.name);
    setFileError(null);
    setFileGeometry(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const data = JSON.parse(text);
        const coords = extractLineString(data);
        if (!coords || coords.length < 2) {
          setFileError("В файле не найден LineString с минимум двумя точками.");
          return;
        }
        setFileGeometry(coords);
      } catch {
        setFileError("Не удалось распарсить файл. Ожидается GeoJSON.");
      }
    };
    reader.onerror = () => setFileError("Ошибка чтения файла.");
    reader.readAsText(file);
  };

  const submit = () => {
    setTouched(true);
    if (!valid || !scenario || submitting || !geometry) return;
    setSubmitting(true);
    const id = `custom-${Date.now().toString(36)}`;
    const project: ProjectGeo = {
      id,
      name: name.trim(),
      type,
      realStatus: "draft",
      originScenarioId: scenario.id,
      commissionYear: yearNum,
      from: from.trim(),
      to: to.trim(),
      geometry,
      lengthKm: Math.round(lenNum),
      investmentBln: 0,
      passengersMln: 0,
      gdpTrln: 0,
      populationMln: 0,
      fleet: 0,
    };
    addProject(scenario.id, project);
    setSubmitting(false);
    onAdded?.(project);
    close();
  };

  const isUserScenario = scenario?.type === "user";

  return (
    <Modal
      open={open && !!scenario}
      onOpenChange={(o) => !o && close()}
      title="Добавить проект"
      description="Новый проект будет привязан к текущему сценарию и доступен во всех его модулях."
      size="lg"
      footer={
        <>
          <ToolbarButton variant="outline" onClick={close} disabled={submitting}>
            Отмена
          </ToolbarButton>
          <ToolbarButton
            variant="solid"
            onClick={submit}
            disabled={!isUserScenario || !valid || submitting}
          >
            {submitting ? "Добавление…" : "Добавить в сценарий"}
          </ToolbarButton>
        </>
      }
    >
      {!isUserScenario ? (
        <div className="border border-[var(--status-pending)]/40 bg-[var(--status-pending)]/10 rounded-sm px-3 py-2 text-xs text-foreground/90 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--status-pending)] shrink-0 mt-0.5" />
          <div>
            Системный сценарий не редактируется напрямую. Создайте пользовательскую копию,
            затем повторите добавление проекта.
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <ScenarioMeta scenario={scenario} />

          <ModeTabs mode={mode} onChange={setMode} />

          <section className="grid grid-cols-2 gap-3">
            <Field label="Название" required error={touched ? errors.name : undefined}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="ВСМ Москва — Казань"
                className={inputCls(touched && errors.name)}
              />
            </Field>
            <Field label="Тип проекта" required>
              <div className="flex flex-wrap gap-1.5">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 border rounded-sm text-xs",
                      type === t
                        ? "bg-card border-[var(--border-soft)] text-foreground"
                        : "bg-transparent border-[var(--border-soft)]/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TYPE_COLOR[t] }}
                    />
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Откуда" required error={touched ? errors.from : undefined}>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Москва"
                className={inputCls(touched && errors.from)}
              />
            </Field>
            <Field label="Куда" required error={touched ? errors.to : undefined}>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Казань"
                className={inputCls(touched && errors.to)}
              />
            </Field>
            <Field
              label="Год запуска"
              required
              hint={`Горизонт сценария: ${startYear}–${endYear}`}
              error={touched ? errors.year : undefined}
            >
              <input
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched(true)}
                inputMode="numeric"
                placeholder={String(startYear + 5)}
                className={inputCls(touched && errors.year)}
              />
            </Field>
            <Field
              label="Протяжённость, км"
              required
              error={touched ? errors.lengthKm : undefined}
            >
              <input
                value={lengthKm}
                onChange={(e) =>
                  setLengthKm(e.target.value.replace(/[^\d.,]/g, ""))
                }
                onBlur={() => setTouched(true)}
                inputMode="decimal"
                placeholder="780"
                className={inputCls(touched && errors.lengthKm)}
              />
            </Field>
          </section>

          <section>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Геометрия маршрута
            </div>

            {mode === "import" ? (
              <div
                className={cn(
                  "border rounded-sm bg-card",
                  touched && errors.geometry
                    ? "border-[var(--status-error)]"
                    : "border-[var(--border-soft)]",
                )}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <FileJson className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1 text-xs">
                    {fileGeometry ? (
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-actual)]" />
                        <span className="font-medium truncate">{fileName}</span>
                        <span className="text-muted-foreground font-mono tabular-nums">
                          {fileGeometry.length} точек
                        </span>
                      </div>
                    ) : fileName ? (
                      <div className="text-muted-foreground truncate">{fileName}</div>
                    ) : (
                      <div className="text-muted-foreground">
                        Поддерживается GeoJSON (Feature / FeatureCollection / LineString).
                      </div>
                    )}
                  </div>
                  <ToolbarButton
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Выбрать файл
                  </ToolbarButton>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.geojson,application/geo+json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                {touched && errors.geometry && (
                  <div className="px-3 pb-2 text-[11px] text-[var(--status-error)]">
                    {errors.geometry}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={coordsText}
                  onChange={(e) => setCoordsText(e.target.value)}
                  onBlur={() => setTouched(true)}
                  rows={6}
                  spellCheck={false}
                  placeholder={"55.7558, 37.6173\n55.4521, 39.0254\n55.7903, 49.1347"}
                  className={cn(
                    "w-full font-mono text-xs bg-card border rounded-sm px-2.5 py-2 leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring",
                    touched && errors.geometry
                      ? "border-[var(--status-error)]"
                      : "border-[var(--border-soft)]",
                  )}
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Формат: «широта, долгота» по одной паре в строке. Минимум 2 точки.
                  </span>
                  <span className="font-mono tabular-nums">
                    {parsedManualGeometry
                      ? `${parsedManualGeometry.length} точек`
                      : "—"}
                  </span>
                </div>
                {touched && errors.geometry && (
                  <div className="mt-1 text-[11px] text-[var(--status-error)]">
                    {errors.geometry}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="border border-dashed border-[var(--border-soft)] rounded-sm bg-muted/30 px-3 py-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
            <Hand className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              Рисование маршрута на карте — backlog. На текущем этапе доступны
              только импорт файла геометрии и ручной ввод координат.
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "import", label: "Импорт геометрии", icon: <Upload className="w-3.5 h-3.5" /> },
    { id: "manual", label: "Ручной ввод", icon: <Pencil className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="inline-flex surface p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors",
            mode === t.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ScenarioMeta({ scenario }: { scenario: ScenarioSummary }) {
  return (
    <div className="surface-soft px-3 py-2 text-xs flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground shrink-0">
        Сценарий
      </div>
      <div className="font-medium truncate">{scenario.name}</div>
      <div className="ml-auto font-mono tabular-nums text-muted-foreground">
        {scenario.startYear}–{scenario.endYear}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
        {required && <span className="text-[var(--status-error)]"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] text-[var(--status-error)]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function inputCls(hasError?: string | false) {
  return cn(
    "w-full bg-card border rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
    hasError ? "border-[var(--status-error)]" : "border-[var(--border-soft)]",
  );
}

function extractLineString(data: any): [number, number][] | null {
  if (!data) return null;
  const fromGeometry = (g: any): [number, number][] | null => {
    if (!g) return null;
    if (g.type === "LineString" && Array.isArray(g.coordinates)) {
      return cleanCoords(g.coordinates);
    }
    if (g.type === "MultiLineString" && Array.isArray(g.coordinates)) {
      // Use the longest part as a single route.
      let best: any[] = [];
      for (const part of g.coordinates) {
        if (Array.isArray(part) && part.length > best.length) best = part;
      }
      return cleanCoords(best);
    }
    return null;
  };
  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    for (const f of data.features) {
      const out = fromGeometry(f?.geometry);
      if (out) return out;
    }
    return null;
  }
  if (data.type === "Feature") return fromGeometry(data.geometry);
  if (typeof data.type === "string") return fromGeometry(data);
  if (Array.isArray(data)) return cleanCoords(data);
  return null;
}

function cleanCoords(arr: any[]): [number, number][] | null {
  const out: [number, number][] = [];
  for (const pt of arr) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const lon = Number(pt[0]);
    const lat = Number(pt[1]);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }
    out.push([lon, lat]);
  }
  return out.length >= 2 ? out : null;
}
