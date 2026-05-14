import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckSquare,
  Square,
  Lock,
  Info,
  CheckCircle2,
} from "lucide-react";
import { SectionHeader } from "../primitives/SectionHeader";
import { ToolbarButton } from "../primitives/Toolbar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlaceholderBlock,
} from "../primitives/States";
import { useExport } from "../state/ExportContext";
import { useToast } from "../state/ToastContext";
import { useScenario } from "../state/ScenarioContext";
import { useProjects } from "../state/ProjectsContext";
import type { ExportContextSnapshot } from "../types";
import { cn } from "../lib/cn";

type Phase = "loading" | "ready" | "error" | "empty";
type Format = "pdf" | "xlsx" | "pptx";
type Template = "rzd" | "basic";

const SECTIONS: { id: string; label: string; allowed: boolean; note?: string }[] = [
  { id: "map", label: "Карта сети", allowed: true },
  { id: "projects", label: "Проекты", allowed: true },
  { id: "compare", label: "Сравнение", allowed: true },
  { id: "ranking", label: "Ранжирование", allowed: true },
  { id: "scenario_compare", label: "Сопоставление сценариев", allowed: true },
];

const FORMATS: { id: Format; label: string; available: boolean; note?: string }[] = [
  { id: "pdf", label: "PDF", available: true },
  { id: "xlsx", label: "Excel", available: true },
  {
    id: "pptx",
    label: "PowerPoint",
    available: false,
    note: "Не реализован в текущей версии",
  },
];

const TEMPLATES: { id: Template; label: string; description: string }[] = [
  { id: "rzd", label: "Корпоративный РЖД", description: "Брендированный шаблон" },
  { id: "basic", label: "Базовый", description: "Минимальное оформление" },
];

const MODULE_LABEL: Record<ExportContextSnapshot["sourceModule"], string> = {
  map: "Карта сети",
  projects: "Проекты",
  project_card: "Карточка проекта",
  compare: "Сравнение",
  ranking: "Ранжирование",
  scenario_compare: "Сопоставление сценариев",
};

export function AdvancedExportScreen() {
  const navigate = useNavigate();
  const { snapshot } = useExport();
  const { scenarios } = useScenario();
  const { getScenarioProjects } = useProjects();

  const [phase, setPhase] = useState<Phase>("loading");
  const [pickedSections, setPickedSections] = useState<Set<string>>(new Set());
  const [pickedProjects, setPickedProjects] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<Format>("pdf");
  const [template, setTemplate] = useState<Template>("rzd");
  const toast = useToast();

  const sourceScenario = useMemo(
    () => scenarios.find((s) => s.id === snapshot?.scenarioId) ?? null,
    [scenarios, snapshot?.scenarioId],
  );

  const projects = useMemo(
    () => getScenarioProjects(snapshot?.scenarioId ?? null),
    [getScenarioProjects, snapshot?.scenarioId],
  );

  // Initialize once from snapshot.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!snapshot) {
        setPhase("empty");
        return;
      }
      if (snapshot.scenarioId && !sourceScenario) {
        setPhase("error");
        return;
      }
      setPickedSections(
        new Set([
          snapshot.sourceModule === "project_card"
            ? "projects"
            : snapshot.sourceModule,
        ]),
      );
      const initialSelection = snapshot.selection ?? [];
      setPickedProjects(
        new Set(
          initialSelection.length > 0
            ? initialSelection
            : projects.map((p) => p.id),
        ),
      );
      setPhase("ready");
    }, 220);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSection = (id: string) => {
    setPickedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleProject = (id: string) => {
    setPickedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allProjectsSelected =
    projects.length > 0 && pickedProjects.size === projects.length;
  const toggleAllProjects = () => {
    setPickedProjects(
      allProjectsSelected ? new Set() : new Set(projects.map((p) => p.id)),
    );
  };

  const handleSubmit = () => {
    toast.show({
      title: "Расширенный экспорт",
      message: "Функция будет доступна в следующей версии.",
      tone: "warning",
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад к исходному разделу
        </button>
        <SectionHeader
          eyebrow="Расширенный экспорт · Конструктор отчётов"
          title="Сборка отчёта на основе текущего контекста"
          subtitle="Модуль доступен только из локального экспорта раздела. Не является постоянным разделом навигации."
          actions={
            <>
              <ToolbarButton variant="outline" onClick={() => navigate(-1)}>
                Отмена
              </ToolbarButton>
              <ToolbarButton variant="solid" onClick={handleSubmit}>
                Сформировать отчёт
              </ToolbarButton>
            </>
          }
          className="border-b-0"
        />
      </div>

      <BacklogStrip />

      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
        {phase === "loading" ? (
          <LoadingState label="Загрузка контекста экспорта" />
        ) : phase === "empty" ? (
          <EmptyState
            title="Контекст экспорта не передан"
            description="Расширенный экспорт открывается только из быстрого экспорта раздела."
            action={
              <ToolbarButton variant="outline" onClick={() => navigate(-1)}>
                Вернуться к разделу
              </ToolbarButton>
            }
          />
        ) : phase === "error" ? (
          <ErrorState
            message="Сценарий-источник недоступен. Откройте экспорт повторно из активного раздела."
            onRetry={() => navigate(-1)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-0">
            <BuilderColumn
              snapshot={snapshot!}
              sourceScenarioName={sourceScenario?.name ?? "—"}
              projects={projects}
              pickedSections={pickedSections}
              onToggleSection={toggleSection}
              pickedProjects={pickedProjects}
              onToggleProject={toggleProject}
              onToggleAllProjects={toggleAllProjects}
              allProjectsSelected={allProjectsSelected}
              format={format}
              onFormat={setFormat}
              template={template}
              onTemplate={setTemplate}
            />
            <SideColumn snapshot={snapshot!} />
          </div>
        )}
      </div>
    </div>
  );
}

function BacklogStrip() {
  return (
    <div className="px-6 pt-3">
      <div className="flex items-start gap-2 border border-dashed border-[var(--border-soft)] rounded-sm bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div>
          <span className="text-foreground/80 font-mono uppercase tracking-[0.12em] text-[10px] mr-2">
            Backlog
          </span>
          [Конструктор отчётов — �� разработке]. Текущая версия позволяет описать состав отчёта и
          выбрать формат. Сборка пакета и расширенные шаблоны появятся в следующих версиях.
        </div>
      </div>
    </div>
  );
}

function BuilderColumn(props: {
  snapshot: ExportContextSnapshot;
  sourceScenarioName: string;
  projects: { id: string; name: string }[];
  pickedSections: Set<string>;
  onToggleSection: (id: string) => void;
  pickedProjects: Set<string>;
  onToggleProject: (id: string) => void;
  onToggleAllProjects: () => void;
  allProjectsSelected: boolean;
  format: Format;
  onFormat: (f: Format) => void;
  template: Template;
  onTemplate: (t: Template) => void;
}) {
  return (
    <div className="space-y-4">
      <Panel
        title="Разделы отчёта"
        eyebrow="Шаг 1 · Состав"
        note="Выберите разделы, которые войдут в отчёт. По умолчанию выбран раздел-источник."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {SECTIONS.map((s) => (
            <CheckRow
              key={s.id}
              checked={props.pickedSections.has(s.id)}
              onToggle={() => props.onToggleSection(s.id)}
              label={s.label}
            />
          ))}
        </div>
      </Panel>

      <Panel
        title="Проекты"
        eyebrow="Шаг 2 · Объекты"
        note={`Из активного сценария доступно ${props.projects.length} проект(ов). Можно ограничить выгрузку подмножеством.`}
        right={
          <button
            onClick={props.onToggleAllProjects}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {props.allProjectsSelected ? "Снять все" : "Выбрать все"}
          </button>
        }
      >
        {props.projects.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            В активном сценарии нет проектов для выгрузки.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[220px] overflow-auto pr-1">
            {props.projects.map((p) => (
              <CheckRow
                key={p.id}
                checked={props.pickedProjects.has(p.id)}
                onToggle={() => props.onToggleProject(p.id)}
                label={p.name}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Формат и шаблон"
        eyebrow="Шаг 3 · Оформление"
        note="Доступные форматы и шаблоны соответствуют документации. PowerPoint появится в следующих версиях."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Формат
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {FORMATS.map((f) => {
                const disabled = !f.available;
                const active = props.format === f.id && !disabled;
                return (
                  <button
                    key={f.id}
                    disabled={disabled}
                    onClick={() => f.available && props.onFormat(f.id)}
                    className={cn(
                      "px-2 py-2 border rounded-sm text-xs flex flex-col items-start gap-1 text-left transition-colors",
                      active && "border-foreground bg-muted/40",
                      !active && !disabled && "border-[var(--border-soft)] hover:border-foreground/40",
                      disabled && "border-[var(--border-soft)] opacity-60 cursor-not-allowed",
                    )}
                    title={f.note ?? ""}
                  >
                    <span className="flex items-center gap-1.5">
                      {disabled && <Lock className="w-3 h-3" />}
                      <span className="font-medium">{f.label}</span>
                    </span>
                    {disabled && (
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {f.note}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Шаблон
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => {
                const active = props.template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => props.onTemplate(t.id)}
                    className={cn(
                      "px-2 py-2 border rounded-sm text-xs flex flex-col items-start gap-1 text-left transition-colors",
                      active
                        ? "border-foreground bg-muted/40"
                        : "border-[var(--border-soft)] hover:border-foreground/40",
                    )}
                  >
                    <span className="font-medium">{t.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {t.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Предпросмотр"
        eyebrow="Шаг 4 · Сборка"
        note="Область предпросмотра отчёта зарезервирована. Реальная сборка пакета появится в следующих версиях."
      >
        <div className="border border-dashed border-[var(--border-soft)] rounded-sm bg-muted/20 py-10 px-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            [Конструктор отчётов — в разработке]
          </div>
          <div className="mt-2 text-xs text-foreground/80">
            Будущая область превью отчёта · {SECTIONS.find((s) => s.id) ? props.pickedSections.size : 0} разделов ·{" "}
            {props.pickedProjects.size} проектов · формат {FORMATS.find((f) => f.id === props.format)?.label} ·{" "}
            шаблон {TEMPLATES.find((t) => t.id === props.template)?.label}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SideColumn({ snapshot }: { snapshot: ExportContextSnapshot }) {
  const filterEntries = Object.entries(snapshot.filters ?? {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  return (
    <div className="space-y-4">
      <Panel title="Параметры из исходного контекста" eyebrow="Контекст">
        <div className="surface-soft">
          <Row k="Раздел-источник" v={MODULE_LABEL[snapshot.sourceModule]} />
          <Row k="Сценарий" v={snapshot.scenarioId ?? "—"} mono />
          <Row
            k="Выбор"
            v={
              snapshot.selection && snapshot.selection.length > 0
                ? `${snapshot.selection.length} элем.`
                : "—"
            }
          />
          <Row
            k="Фильтры"
            v={
              filterEntries.length === 0
                ? "—"
                : filterEntries
                    .map(([k, v]) => `${k}: ${formatFilter(v)}`)
                    .join(" · ")
            }
          />
        </div>
      </Panel>

      <PlaceholderBlock
        title="Регламентированная отчётность"
        note="Регламентированная отчётность отнесена к backlog (L0-06) и не входит в текущий конструктор отчётов."
      />
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  note,
  right,
  children,
}: {
  title: string;
  eyebrow?: string;
  note?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="surface">
      <div className="px-3 py-2 border-b border-[var(--border-soft)] flex items-start justify-between gap-3">
        <div>
          {eyebrow && (
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <div className="text-sm font-medium mt-0.5">{title}</div>
          {note && (
            <div className="text-[11px] text-muted-foreground mt-1 max-w-xl">{note}</div>
          )}
        </div>
        {right}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 text-xs border rounded-sm text-left transition-colors",
        checked
          ? "border-foreground/40 bg-muted/40"
          : "border-[var(--border-soft)] hover:border-foreground/30",
      )}
    >
      {checked ? (
        <CheckSquare className="w-3.5 h-3.5 text-foreground" />
      ) : (
        <Square className="w-3.5 h-3.5 text-muted-foreground" />
      )}
      <span className="truncate">{label}</span>
      {checked && <CheckCircle2 className="w-3 h-3 text-[var(--status-actual)] ml-auto" />}
    </button>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 px-3 py-1.5 text-xs border-b border-[var(--border-soft)] last:border-b-0">
      <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {k}
      </span>
      <span className={cn("truncate", mono && "font-mono")} title={v}>
        {v}
      </span>
    </div>
  );
}

function formatFilter(v: unknown): string {
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  if (typeof v === "boolean") return v ? "да" : "нет";
  return String(v);
}
