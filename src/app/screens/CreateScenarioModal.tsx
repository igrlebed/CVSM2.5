import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Loader2, CalendarRange, FolderOpen, ListChecks } from "lucide-react";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import {
  SYSTEM_PROJECTS,
  useScenario,
} from "../state/ScenarioContext";
import { TYPE_COLOR } from "../map/projectsData";
import { cn } from "../lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const HORIZON_MIN = 2025;
const HORIZON_MAX = 2070;
const NAME_MAX = 120;
const DESC_MAX = 500;

export function CreateScenarioModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { createScenario, setActiveScenario } = useScenario();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startYear, setStartYear] = useState<number | "">(2025);
  const [endYear, setEndYear] = useState<number | "">(2050);
  const [projectIds, setProjectIds] = useState<string[]>(
    SYSTEM_PROJECTS.map((p) => p.id),
  );
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    horizon: false,
    projects: false,
  });

  const errors = useMemo(() => {
    const e: { name?: string; horizon?: string; projects?: string } = {};
    if (name.trim().length === 0) e.name = "Укажите название сценария.";
    else if (name.trim().length > NAME_MAX)
      e.name = `Не более ${NAME_MAX} символов.`;
    if (
      startYear === "" ||
      endYear === "" ||
      typeof startYear !== "number" ||
      typeof endYear !== "number"
    )
      e.horizon = "Заполните оба года горизонта.";
    else if (
      startYear < HORIZON_MIN ||
      endYear > HORIZON_MAX ||
      startYear >= endYear
    )
      e.horizon = `Допустимый диапазон: ${HORIZON_MIN}–${HORIZON_MAX}, конечный год должен быть больше начального.`;
    if (projectIds.length === 0)
      e.projects = "Состав проектов не может быть пустым.";
    return e;
  }, [name, startYear, endYear, projectIds]);

  const isValid = Object.keys(errors).length === 0;

  const reset = () => {
    setName("");
    setDescription("");
    setStartYear(2025);
    setEndYear(2050);
    setProjectIds(SYSTEM_PROJECTS.map((p) => p.id));
    setTouched({ name: false, horizon: false, projects: false });
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    setTouched({ name: true, horizon: true, projects: true });
    if (!isValid || submitting) return;
    setSubmitting(true);
    const id = createScenario({
      name,
      description,
      startYear: startYear as number,
      endYear: endYear as number,
      projectIds,
    });
    setActiveScenario(id);
    onOpenChange(false);
    reset();
    navigate("/map");
  };

  const toggleProject = (id: string) => {
    setProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Создать сценарий"
      description="Пользовательский сценарий — независимая рабочая копия состава проектов и горизонта планирования."
      size="lg"
      footer={
        <>
          <ToolbarButton
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            disabled={submitting}
          >
            Отмена
          </ToolbarButton>
          <ToolbarButton
            variant="solid"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Создание…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Создать и открыть
              </>
            )}
          </ToolbarButton>
        </>
      }
    >
      <div className="space-y-0 divide-y divide-[var(--border-soft)]">

        {/* ── Section 1: Основные параметры ── */}
        <section className="pb-6">
          <SectionTitle icon={<FolderOpen className="w-3.5 h-3.5" />} label="Основные параметры" />
          <div className="space-y-4 mt-4">
            <Field
              label="Название"
              required
              error={touched.name ? errors.name : undefined}
              counter={`${name.length}/${NAME_MAX}`}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                maxLength={NAME_MAX}
                placeholder="Например: Альтернативный состав — северное направление"
                className={inputClass(touched.name && !!errors.name)}
                autoFocus
              />
            </Field>

            <Field
              label="Описание"
              counter={`${description.length}/${DESC_MAX}`}
              hint="Контекст, гипотеза или ограничение, отличающее сценарий от базового."
            >
              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, DESC_MAX))
                }
                rows={3}
                placeholder="Необязательное краткое пояснение цели сценария."
                className={cn(inputClass(false), "resize-none")}
              />
            </Field>
          </div>
        </section>

        {/* ── Section 2: Горизонт планирования ── */}
        <section className="py-6">
          <SectionTitle icon={<CalendarRange className="w-3.5 h-3.5" />} label="Горизонт планирования" />
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <YearInput
                label="Начальный год"
                value={startYear}
                onChange={(v) => setStartYear(v)}
                onBlur={() => setTouched((t) => ({ ...t, horizon: true }))}
                invalid={touched.horizon && !!errors.horizon}
              />
              <YearInput
                label="Конечный год"
                value={endYear}
                onChange={(v) => setEndYear(v)}
                onBlur={() => setTouched((t) => ({ ...t, horizon: true }))}
                invalid={touched.horizon && !!errors.horizon}
              />
            </div>
            {touched.horizon && errors.horizon ? (
              <p className="text-[11px] text-[var(--status-error)]">
                {errors.horizon}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Допустимый диапазон: {HORIZON_MIN}–{HORIZON_MAX}.
                Конечный год должен быть больше начального.
              </p>
            )}
          </div>
        </section>

        {/* ── Section 3: Состав проектов ── */}
        <section className="pt-6">
          <div className="flex items-center justify-between mb-1">
            <SectionTitle
              icon={<ListChecks className="w-3.5 h-3.5" />}
              label="Состав проектов"
              required
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setProjectIds(SYSTEM_PROJECTS.map((p) => p.id))
                }
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Выбрать все
              </button>
              <span className="text-border text-[11px]">·</span>
              <button
                type="button"
                onClick={() => {
                  setProjectIds([]);
                  setTouched((t) => ({ ...t, projects: true }));
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Снять все
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mb-3">
            По умолчанию включены {SYSTEM_PROJECTS.length} системных проектов.
            Снимите флаг, чтобы исключить проект из сценария.
          </p>

          {touched.projects && errors.projects && (
            <p className="text-[11px] text-[var(--status-error)] mb-2">
              {errors.projects}
            </p>
          )}

          <div className="surface divide-y divide-[var(--border-soft)] max-h-[280px] overflow-auto">
            {SYSTEM_PROJECTS.map((p) => {
              const checked = projectIds.includes(p.id);
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors",
                    checked && "bg-muted/20",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      toggleProject(p.id);
                      setTouched((t) => ({ ...t, projects: true }));
                    }}
                  />
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: TYPE_COLOR[p.type] }}
                  />
                  <span className="flex-1 truncate text-xs font-medium">
                    {p.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide font-mono text-muted-foreground shrink-0">
                    {p.type}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
            Выбрано:{" "}
            <span className="text-foreground font-mono">
              {projectIds.length}
            </span>{" "}
            из {SYSTEM_PROJECTS.length}
          </div>
        </section>

      </div>

      {/* Info note */}
      <div className="mt-6 pt-4 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground leading-relaxed">
        После подтверждения сценарий помечается как{" "}
        <span className="font-mono text-[var(--status-pending)]">
          в&nbsp;расчёте
        </span>
        . До завершения базового расчёта аналитические показатели не
        отображаются как готовые значения.
      </div>
    </Modal>
  );
}

/* ─── Section title ──────────────────────────────────────────────────────── */
function SectionTitle({
  icon,
  label,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold text-foreground uppercase tracking-[0.08em]">
        {label}
      </span>
      {required && (
        <span className="text-[10px] font-mono text-[var(--status-error)] uppercase tracking-wide">
          обязательно
        </span>
      )}
    </div>
  );
}

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
function Field({
  label,
  required,
  hint,
  error,
  counter,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-medium">{label}</span>
          {required ? (
            <span className="text-[10px] font-mono text-[var(--status-error)] uppercase tracking-wide">
              обязательно
            </span>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
              необязательно
            </span>
          )}
        </div>
        {counter && (
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            {counter}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] text-[var(--status-error)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ─── Year input ─────────────────────────────────────────────────────────── */
function YearInput({
  label,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        min={HORIZON_MIN}
        max={HORIZON_MAX}
        step={1}
        value={value}
        onBlur={onBlur}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange("");
          const n = Number(v);
          onChange(Number.isFinite(n) ? n : "");
        }}
        className={cn(
          "w-full bg-card border rounded-sm px-3 py-2 text-sm tabular-nums font-mono focus:outline-none focus:ring-1 focus:ring-ring",
          invalid
            ? "border-[var(--status-error)]"
            : "border-[var(--border-soft)]",
        )}
      />
    </div>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "w-full bg-card border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
    invalid ? "border-[var(--status-error)]" : "border-[var(--border-soft)]",
  );
}
