import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Download,
  GitCompareArrows,
  Pencil,
  Lock,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ToolbarButton } from "../primitives/Toolbar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PlaceholderBlock,
} from "../primitives/States";
import { StatusBadge } from "../primitives/StatusBadge";
import { useScenario } from "../state/ScenarioContext";
import { useProjects } from "../state/ProjectsContext";
import { useCompare } from "../state/CompareContext";
import { useProjectEdits } from "../state/ProjectEditsContext";
import {
  ProjectEditDialog,
  CopyRequiredDialog,
  type EditGroup,
} from "./ProjectEditDialog";
import {
  TYPE_COLOR,
  STATUS_LABEL,
  type ProjectGeo,
} from "../map/projectsData";
import type { CalcStatus, ScenarioSummary } from "../types";
import { cn } from "../lib/cn";
import {
  PassengerFlowChart,
  CargoCompositionChart,
  CapacityBalanceChart,
  FcfChart,
} from "../charts/ProjectCharts";
import { FinancingSchemeBlock } from "../charts/FinancingSchemeBlock";
import { SensitivityBlock } from "../charts/SensitivityBlock";
import { TerrainBlock } from "../charts/TerrainBlock";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "source", label: "Исходные данные" },
  { id: "passenger", label: "Пассажирские перевозки" },
  { id: "cargo", label: "Грузовые перевозки" },
  { id: "infra", label: "Инфраструктура" },
  { id: "finance", label: "Финансовая модель" },
  { id: "social", label: "Социально-экономические эффекты" },
  { id: "risks", label: "Участники и риски" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface EditEntryCtxValue {
  isLockedHard: boolean;
  isSystemScenario: boolean;
  request: (group: EditGroup) => void;
}
const EditEntryCtx = createContext<EditEntryCtxValue | null>(null);
function useEditEntry() {
  return useContext(EditEntryCtx);
}

const SYSTEM_IDS = new Set([
  "msk-spb",
  "msk-ekb",
  "msk-adler",
  "msk-minsk",
  "msk-ryazan",
  "msk-belgorod",
  "msk-bryansk",
  "msk-yaroslavl",
]);

export function ProjectCardScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeScenario } = useScenario();
  const { getScenarioProjects, isCustom, cloneScenarioProjects } = useProjects();
  const compare = useCompare();

  const scenarioProjects = useMemo(
    () => getScenarioProjects(activeScenario?.id ?? null),
    [getScenarioProjects, activeScenario?.id],
  );

  type LoadState = "loading" | "ready" | "empty" | "error";
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [tab, setTab] = useState<TabId>("overview");
  const [addedFlash, setAddedFlash] = useState(false);

  const { setCalcStatus, copyScenario, setActiveScenario } = useScenario();
  const edits = useProjectEdits();
  const [editGroup, setEditGroup] = useState<EditGroup | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => {
      if (!id) {
        setLoadState("empty");
      } else if (scenarioProjects.find((p) => p.id === id)) {
        setLoadState("ready");
      } else {
        setLoadState("empty");
      }
    }, 200);
    return () => clearTimeout(t);
  }, [id, scenarioProjects]);

  const project = useMemo(
    () => scenarioProjects.find((p) => p.id === id) ?? null,
    [scenarioProjects, id],
  );

  if (loadState === "loading") {
    return (
      <ShellFrame onBack={() => navigate(-1)}>
        <LoadingState label="Загрузка карточки проекта" />
      </ShellFrame>
    );
  }
  if (loadState === "error") {
    return (
      <ShellFrame onBack={() => navigate(-1)}>
        <ErrorState
          message="Не удалось загрузить карточку проекта."
          onRetry={() => setLoadState("loading")}
        />
      </ShellFrame>
    );
  }
  if (!project) {
    return (
      <ShellFrame onBack={() => navigate(-1)}>
        <EmptyState
          title="Проект не найден"
          description={
            activeScenario
              ? `В сценарии «${activeScenario.name}» нет проекта с идентификатором ${id}.`
              : "Откройте сценарий, чтобы получить доступ к карточке проекта."
          }
          action={
            <ToolbarButton variant="outline" onClick={() => navigate("/projects")}>
              К списку проектов
            </ToolbarButton>
          }
        />
      </ShellFrame>
    );
  }

  const isSystemOrigin =
    SYSTEM_IDS.has(project.id) ||
    !isCustom(activeScenario?.id ?? null, project.id);
  const isSystemScenario = activeScenario?.type === "system";
  const isLockedName = project.id === "msk-spb";
  const calcStatus: CalcStatus = activeScenario?.calcStatus ?? "not_calculated";
  const inCompare = compare.has(project.id);

  // --- Edit popup wiring -------------------------------------------------
  const requestEdit = (group: EditGroup) => {
    if (isLockedName) return;
    if (isSystemScenario) {
      setCopyOpen(true);
      return;
    }
    setEditGroup(group);
    setEditOpen(true);
  };

  const onSaveEdit = (
    tabId: EditGroup["tabId"],
    changedKeys: string[],
    _values: Record<string, string | number>,
  ) => {
    if (!project || !activeScenario) return;
    edits.markChanged(project.id, tabId, changedKeys);
    // Recalc pipeline: in_calculation -> actual.
    setCalcStatus(activeScenario.id, "in_calculation");
    setTimeout(() => {
      setCalcStatus(activeScenario.id, "actual");
    }, 1400);
  };

  const onConfirmCopy = () => {
    if (!activeScenario) return;
    const newId = copyScenario(activeScenario.id);
    if (newId) {
      cloneScenarioProjects(activeScenario.id, newId);
      setActiveScenario(newId);
      setCalcStatus(newId, "stale_after_changes");
    }
    setCopyOpen(false);
  };

  const editCtxValue: EditEntryCtxValue = {
    isLockedHard: isLockedName,
    isSystemScenario: !!isSystemScenario,
    request: requestEdit,
  };
  // -----------------------------------------------------------------------

  const onCompare = () => {
    if (inCompare) compare.remove(project.id);
    else {
      compare.add(project.id);
      setAddedFlash(true);
      setTimeout(() => setAddedFlash(false), 2200);
    }
  };

  const changedTabs = edits.changedTabs(project.id);

  const projectIndex = scenarioProjects.findIndex((p) => p.id === project.id);
  const totalProjects = scenarioProjects.length;
  const prevProject =
    projectIndex > 0 ? scenarioProjects[projectIndex - 1] : null;
  const nextProject =
    projectIndex >= 0 && projectIndex < totalProjects - 1
      ? scenarioProjects[projectIndex + 1]
      : null;

  return (
    <EditEntryCtx.Provider value={editCtxValue}>
    <div className="flex-1 min-h-0 flex flex-col">
      <ProjectHeader
        project={project}
        scenario={activeScenario}
        isSystemOrigin={isSystemOrigin}
        isSystemScenario={isSystemScenario}
        isLockedName={isLockedName}
        calcStatus={calcStatus}
        inCompare={inCompare}
        prevProject={prevProject}
        nextProject={nextProject}
        positionLabel={
          projectIndex >= 0 && totalProjects > 0
            ? `${projectIndex + 1} из ${totalProjects}`
            : null
        }
        onPickProject={(pid) => navigate(`/projects/${pid}`)}
        scenarioProjects={scenarioProjects}
        onBack={() => navigate(-1)}
        onCompare={onCompare}
        addedFlash={addedFlash}
        onEditClick={() =>
          requestEdit({
            groupTitle: "Атрибуты проекта",
            groupDescription:
              "Базовые ��едактируемые атрибуты проекта в рамках сценария.",
            tabId: "source",
            fields: [
              { key: "name", label: "Название", type: "text", locked: true, initial: project.name },
              { key: "commissionYear", label: "Базовый год запуска", type: "year", locked: true, initial: project.commissionYear },
              { key: "lengthKm", label: "Протяжённость", type: "number", unit: "км", min: 1, initial: project.lengthKm },
            ],
          })
        }
      />

      <Tabs current={tab} onChange={setTab} changedTabs={changedTabs} />

      <div className="flex-1 min-h-0 overflow-auto px-6 py-5">
        {tab === "overview" ? (
          <OverviewTab project={project} scenario={activeScenario} calcStatus={calcStatus} />
        ) : tab === "source" ? (
          <SourceTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "passenger" ? (
          <PassengerTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "cargo" ? (
          <CargoTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "infra" ? (
          <InfraTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "finance" ? (
          <FinanceTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "social" ? (
          <SocialTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : tab === "risks" ? (
          <RisksTab
            project={project}
            scenario={activeScenario}
            calcStatus={calcStatus}
            isSystemScenario={isSystemScenario}
            isLockedName={isLockedName}
          />
        ) : (
          <PlaceholderBlock
            title={`Вкла����а: ${TABS.find((t) => t.id === tab)?.label}`}
            note="Содержимое вкладки будет реализовано в последующих итерациях. Структурный каркас и порядок вкладок зафиксированы документацией."
          />
        )}
      </div>

      <ProjectEditDialog
        open={editOpen}
        group={editGroup}
        onClose={() => setEditOpen(false)}
        onSave={onSaveEdit}
      />
      <CopyRequiredDialog
        open={copyOpen}
        scenarioName={activeScenario?.name}
        onCancel={() => setCopyOpen(false)}
        onCopy={onConfirmCopy}
      />
    </div>
    </EditEntryCtx.Provider>
  );
}

/* ----------------------------- Header ----------------------------- */

function ProjectHeader({
  project,
  scenario,
  isSystemOrigin,
  isSystemScenario,
  isLockedName,
  calcStatus,
  inCompare,
  onBack,
  onCompare,
  addedFlash,
  onEditClick,
  prevProject,
  nextProject,
  positionLabel,
  onPickProject,
  scenarioProjects,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  isSystemOrigin: boolean;
  isSystemScenario: boolean;
  isLockedName: boolean;
  calcStatus: CalcStatus;
  inCompare: boolean;
  onBack: () => void;
  onCompare: () => void;
  addedFlash: boolean;
  onEditClick: () => void;
  prevProject: ProjectGeo | null;
  nextProject: ProjectGeo | null;
  positionLabel: string | null;
  onPickProject: (id: string) => void;
  scenarioProjects: ProjectGeo[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const horizon = scenario
    ? `${scenario.startYear}–${scenario.endYear}`
    : "—";
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: особый статус, редактирование недоступно."
      : "Открыть редактирование атрибутов проекта";

  return (
    <div className="px-6 pt-5 pb-3 border-b border-[var(--border-soft)] bg-card">
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => prevProject && onPickProject(prevProject.id)}
            disabled={!prevProject}
            title={prevProject ? `Предыдущий: ${prevProject.name}` : "Это пе��вый проект сценария"}
            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-[var(--border-soft)] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Предыдущий проект"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="px-2 h-7 text-xs rounded-sm border border-[var(--border-soft)] hover:bg-muted min-w-[110px] text-center tabular-nums"
              title="Выбрать другой проект сценария"
            >
              {positionLabel ?? "—"}
            </button>
            {pickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setPickerOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-card border border-[var(--border-soft)] rounded-md shadow-md min-w-[280px] max-h-[320px] overflow-auto">
                  <ul className="py-1">
                    {scenarioProjects.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => {
                            setPickerOpen(false);
                            if (p.id !== project.id) onPickProject(p.id);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted",
                            p.id === project.id && "bg-muted/60",
                          )}
                        >
                          <span
                            aria-hidden
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLOR[p.type] }}
                          />
                          <span className="truncate flex-1">{p.name}</span>
                          {p.id === project.id && (
                            <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => nextProject && onPickProject(nextProject.id)}
            disabled={!nextProject}
            title={nextProject ? `Следующий: ${nextProject.name}` : "Это последний проект сценария"}
            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-[var(--border-soft)] hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Следующий проект"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
            Карточка проекта · {project.id}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: TYPE_COLOR[project.type] }}
            />
            <h1 className="text-lg font-semibold truncate">{project.name}</h1>
            {isLockedName && (
              <span
                title="Особый статус: редактирование недоступно ни в каком режиме сценария"
                className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <dl className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
            <Meta label="Тип проекта">
              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[11px] font-medium">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: TYPE_COLOR[project.type] }}
                />
                {project.type}
              </span>
            </Meta>
            <Meta label="Происхождение">
              <span
                className={cn(
                  "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide",
                  isSystemOrigin
                    ? "bg-primary/5 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-[var(--border-soft)]",
                )}
              >
                {isSystemOrigin ? "Системный" : "Добавленный"}
              </span>
            </Meta>
            <Meta label="Горизонт планирования">
              <span className="font-mono tabular-nums">{horizon}</span>
            </Meta>
            <Meta label="Статус расчёта">
              <StatusBadge status={calcStatus} />
            </Meta>
          </dl>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ToolbarButton variant="outline" onClick={onCompare}>
            <GitCompareArrows className="w-3.5 h-3.5" />
            {inCompare ? "Убрать из сравнения" : "Добавить к сравнению"}
            {addedFlash && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-actual)]" />
            )}
          </ToolbarButton>
          <ToolbarButton
            variant="outline"
            disabled={isLockedName}
            title={editTitle}
            onClick={onEditClick}
          >
            <Pencil className="w-3.5 h-3.5" />
            Редактирование
          </ToolbarButton>
          <ToolbarButton variant="outline">
            <Download className="w-3.5 h-3.5" />
            Экспорт
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

/* ----------------------------- Tabs ----------------------------- */

function Tabs({
  current,
  onChange,
  changedTabs,
}: {
  current: TabId;
  onChange: (t: TabId) => void;
  changedTabs: Set<TabId>;
}) {
  return (
    <div className="px-6 border-b border-[var(--border-soft)] bg-card">
      <div
        role="tablist"
        aria-label="Разделы карточки проекта"
        className="flex overflow-x-auto -mb-px"
      >
        {TABS.map((t) => {
          const changed = changedTabs.has(t.id);
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={current === t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                "px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors inline-flex items-center gap-1.5",
                current === t.id
                  ? "border-[var(--accent)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {changed && (
                <span
                  aria-label="Внутри вкладки есть изменённые данные"
                  title="Внутри вкладки есть изменённые данные"
                  className="w-1.5 h-1.5 rounded-full bg-[var(--status-stale)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- Overview ----------------------------- */

function OverviewTab({
  project,
  scenario,
  calcStatus,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
}) {
  // Per-tab state: this tab uses scenario calcStatus to gate KPI/effect display.
  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария" />;
  }
  if (hasError) {
    return (
      <ErrorState
        message="Ошибка расчёта сценария. Зависимые KPI проекта недоступны."
      />
    );
  }

  // Integral effect: documented as "Интегральный эффект проекта для сценария".
  // Without backend numbers, anchor on documented project metrics. If status is
  // not_calculated, omit the value and show a structural placeholder.
  const integralAvailable = !notCalculated && project.gdpTrln > 0;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеЧасть показателей карточки недоступна до запуска расчёта."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить производные показатели карточки."}
          </div>
        </div>
      )}

      <KpiBlock project={project} integralAvailable={integralAvailable} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProjectStatusBlock project={project} calcStatus={calcStatus} />
        <NarrativeBlock project={project} scenario={scenario} />
      </div>

      <StagesBlock project={project} scenario={scenario} />
    </div>
  );
}

function KpiBlock({
  project,
  integralAvailable,
}: {
  project: ProjectGeo;
  integralAvailable: boolean;
}) {
  const items: { label: string; value: string; unit?: string; muted?: boolean }[] = [
    {
      label: "Пассажиропоток",
      value:
        project.passengersMln > 0
          ? project.passengersMln.toFixed(1).replace(".", ",")
          : "—",
      unit: "млн чел./год",
    },
    {
      label: "Инвестиции",
      value:
        project.investmentBln > 0
          ? Math.round(project.investmentBln).toLocaleString("ru-RU")
          : "—",
      unit: "млрд руб.",
    },
    {
      label: "Протяжённость",
      value: project.lengthKm.toLocaleString("ru-RU"),
      unit: "км",
    },
    {
      label: "Год ввода",
      value: String(project.commissionYear),
    },
    {
      label: "Интегральный эффект для сценария",
      value: integralAvailable
        ? project.gdpTrln.toFixed(2).replace(".", ",")
        : "—",
      unit: integralAvailable ? "трлн руб. ВВП" : undefined,
      muted: !integralAvailable,
    },
  ];
  return (
    <section>
      <SubHeader title="Ключевые показатели проекта" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-[var(--border-soft)] rounded-md overflow-hidden">
        {items.map((it) => (
          <div
            key={it.label}
            className="bg-card px-4 py-3 flex flex-col gap-1.5 min-h-[88px]"
          >
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              {it.label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-xl font-mono tabular-nums leading-none",
                  it.muted ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {it.value}
              </span>
              {it.unit && (
                <span className="text-[11px] text-muted-foreground">
                  {it.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectStatusBlock({
  project,
  calcStatus,
}: {
  project: ProjectGeo;
  calcStatus: CalcStatus;
}) {
  return (
    <section className="lg:col-span-1 surface">
      <SubHeader title="Статус проекта" inset />
      <dl className="divide-y divide-[var(--border-soft)] text-xs">
        <Row label="Статус реализации">
          <span className="inline-flex items-center px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[10px] font-medium uppercase tracking-wide bg-muted text-foreground/80">
            {STATUS_LABEL[project.realStatus]}
          </span>
        </Row>
        <Row label="Год ввода">
          <span className="font-mono tabular-nums">{project.commissionYear}</span>
        </Row>
        <Row label="Маршрут">
          <span className="truncate">
            {project.from} → {project.to}
          </span>
        </Row>
        <Row label="Расчёт сценария">
          <StatusBadge status={calcStatus} />
        </Row>
      </dl>
    </section>
  );
}

function NarrativeBlock({
  project,
  scenario,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
}) {
  const text = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      `Проект ${project.name} типа «${project.type}» включён в сценарий${scenario ? ` «${scenario.name}»` : ""}.`,
    );
    parts.push(
      `Маршрут протяжённостью ${project.lengthKm.toLocaleString("ru-RU")} км между пунктами ${project.from} и ${project.to}, плановый год ввода — ${project.commissionYear}.`,
    );
    parts.push(
      `Текущий статус реализации: ${STATUS_LABEL[project.realStatus].toLowerCase()}.`,
    );
    return parts.join(" ");
  }, [project, scenario]);

  return (
    <section className="lg:col-span-2 surface">
      <SubHeader title="Роль проекта в сценарии" inset />
      <div className="px-4 py-3 text-xs leading-relaxed text-foreground/90">
        {text}
        <div className="mt-2 text-[11px] text-muted-foreground">
          Расширенное описание роли — во вкладках «Исходные данные» и
          «Социально-экономические эффекты».
        </div>
      </div>
    </section>
  );
}

function StagesBlock({
  project,
  scenario,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
}) {
  const startYear = scenario?.startYear ?? Math.min(project.commissionYear - 6, 2025);
  const endYear = scenario?.endYear ?? Math.max(project.commissionYear + 5, 2050);
  const span = Math.max(1, endYear - startYear);

  const intro = Math.max(startYear, project.commissionYear - 6);
  const piEnd = Math.max(intro + 1, project.commissionYear - 3);
  const cmrEnd = Math.max(piEnd + 1, project.commissionYear);
  const stages = [
    { id: "pir", label: "ПИР", from: intro, to: piEnd },
    { id: "smr", label: "СМР", from: piEnd, to: cmrEnd },
    {
      id: "intro",
      label: "Ввод в эксплуатацию",
      from: project.commissionYear,
      to: project.commissionYear,
    },
  ];

  const yearTicks: number[] = [];
  for (let y = startYear; y <= endYear; y += 5) yearTicks.push(y);
  if (yearTicks[yearTicks.length - 1] !== endYear) yearTicks.push(endYear);

  const pct = (y: number) => ((y - startYear) / span) * 100;

  return (
    <section className="surface">
      <SubHeader
        title="Таймлайн этапов и ввод"
        inset
        right={
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {startYear}–{endYear}
          </span>
        }
      />
      <div className="px-4 pt-3 pb-2">
        <div className="space-y-2">
          {stages.map((s) => {
            const isPoint = s.from === s.to;
            const left = pct(s.from);
            const width = isPoint ? 0 : pct(s.to) - left;
            return (
              <div
                key={s.id}
                className="grid grid-cols-[120px_1fr_120px] items-center gap-3 text-xs"
              >
                <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  {s.label}
                </div>
                <div className="relative h-5 bg-muted/40 rounded-sm border border-[var(--border-soft)]">
                  {isPoint ? (
                    <span
                      className="absolute top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground border-2 border-card"
                      style={{ left: `${left}%` }}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="absolute top-0.5 bottom-0.5 rounded-sm border border-[var(--border-soft)]"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: TYPE_COLOR[project.type],
                        opacity: 0.6,
                      }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="font-mono tabular-nums text-[11px] text-muted-foreground text-right">
                  {isPoint ? s.from : `${s.from}–${s.to}`}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-[120px_1fr_120px] gap-3">
          <div />
          <div className="relative h-4">
            {yearTicks.map((y) => (
              <span
                key={y}
                className="absolute -translate-x-1/2 text-[10px] font-mono tabular-nums text-muted-foreground"
                style={{ left: `${pct(y)}%` }}
              >
                {y}
              </span>
            ))}
          </div>
          <div />
        </div>

        <div className="mt-2 text-[11px] text-muted-foreground border-t border-[var(--border-soft)] pt-2 leading-relaxed">
          Сроки этапов ПИР и СМР ��оказаны как структурный таймлайн, привязанный к
          году ввода. Точные даты этапов — во вкладке «Исходные данные».
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Source Data ----------------------------- */

function SourceTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const edits = useProjectEdits();
  const isChanged = (k: string) => edits.isFieldChanged(project.id, "source", k);

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 180);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка исходных данных" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить исходные данные проекта."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования группы";

  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";
  const hasError = calcStatus === "calculation_error";

  // Derived stage years — anchored to commissionYear, exact dates live here.
  const piStart = project.commissionYear - 6;
  const piEnd = project.commissionYear - 3;
  const cmrStart = project.commissionYear - 3;
  const cmrEnd = project.commissionYear;
  const intro = project.commissionYear;

  const points = project.geometry.length;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated || hasError) && (
        <div
          className={cn(
            "flex items-start gap-2 px-3 py-2 border rounded-sm text-xs",
            hasError
              ? "border-[var(--status-error)]/30 bg-[var(--status-error)]/10"
              : "border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10",
          )}
        >
          <Info
            className={cn(
              "w-4 h-4 shrink-0 mt-0.5",
              hasError ? "text-[var(--status-error)]" : "text-[var(--status-stale)]",
            )}
          />
          <div className="text-foreground/90">
            {hasError
              ? "Ошибка расчёта сценария: значения, производные от исходных данных, могут быть устаревшими."
              : notCalculated
                ? "В прототипеПроизводные от исходных данных показатели на других вкладках недоступны."
                : "Исходные данные изменены. Запустите перерасчёт сценария, чтобы синхронизировать зависимые показатели."}
          </div>
        </div>
      )}

      {/* 1. Технические параметры */}
      <DataGroup
        title="Технические параметры"
        editLabel="Изменить технические параметры"
        editLocked={editLocked}
        editTitle={editTitle}
        note="Название проекта и базовый год запуска не редактируются по проектным правилам."
        group={{
          groupTitle: "Технические параметры",
          tabId: "source",
          fields: [
            { key: "name", label: "Название", type: "text", locked: true, initial: project.name },
            { key: "type", label: "Тип проекта", type: "select", initial: project.type, options: [
              { value: "ВСМ", label: "ВСМ" },
              { value: "СМ", label: "СМ" },
              { value: "ВСМ Международный", label: "ВСМ Международный" },
              { value: "ВСМ Введённый", label: "ВСМ Введённый" },
            ] },
            { key: "lengthKm", label: "Протяжённость", type: "number", unit: "км", required: true, min: 1, initial: project.lengthKm },
            { key: "commissionYear", label: "Базовый год запуска", type: "year", locked: true, initial: project.commissionYear },
          ],
        }}
      >
        <DataRow label="Идентификатор проекта">
          <span className="font-mono text-[11px]">{project.id}</span>
        </DataRow>
        <DataRow label="Название" lockedField>
          <span>{project.name}</span>
        </DataRow>
        <DataRow label="Тип проекта">
          <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[11px] font-medium">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: TYPE_COLOR[project.type] }}
            />
            {project.type}
          </span>
        </DataRow>
        <DataRow label="Протяжённость" changed={isChanged("lengthKm")}>
          <span className="font-mono tabular-nums">
            {project.lengthKm.toLocaleString("ru-RU")} км
          </span>
        </DataRow>
        <DataRow label="Базовый год запуска" lockedField>
          <span className="font-mono tabular-nums">{project.commissionYear}</span>
        </DataRow>
        <DataRow label="Статус реализации">
          <span className="inline-flex items-center px-1.5 py-0.5 border border-[var(--border-soft)] rounded-md text-[10px] font-medium uppercase tracking-wide bg-muted text-foreground/80">
            {STATUS_LABEL[project.realStatus]}
          </span>
        </DataRow>
      </DataGroup>

      {/* 2. Состав маршрута */}
      <DataGroup
        title="Состав маршрута"
        editLabel="Изменить состав маршрута"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Состав маршрута",
          tabId: "source",
          fields: [
            { key: "from", label: "Начальный пункт", type: "text", required: true, initial: project.from },
            { key: "to", label: "Конечный пункт", type: "text", required: true, initial: project.to },
            { key: "lengthKm", label: "Протяжённость", type: "number", unit: "км", required: true, min: 1, initial: project.lengthKm },
          ],
        }}
      >
        <DataRow label="Начальный пункт">
          <span>{project.from}</span>
        </DataRow>
        <DataRow label="Конечный пункт">
          <span>{project.to}</span>
        </DataRow>
        <DataRow label="Опорные узлы трассы">
          <span className="font-mono tabular-nums">{points}</span>
        </DataRow>
        <DataRow label="Тип геометрии">
          <span className="text-muted-foreground">
            Схематичная полилиния (lon/lat)
          </span>
        </DataRow>
      </DataGroup>

      {/* 3. Этапы ПИР / СМР / Ввода */}
      <section className="surface">
        <SubHeader
          title="Этапы ПИР / СМР / Ввода"
          inset
          right={
            <CargoEditButton
              label="Изменить сроки"
              editLocked={editLocked}
              editTitle={editTitle}
              group={{
                groupTitle: "Этапы ПИР / СМР / Ввода",
                tabId: "source",
                fields: [
                  { key: "piStart", label: "ПИР: начало", type: "year", required: true, initial: piStart },
                  { key: "piEnd", label: "ПИР: окончание", type: "year", required: true, initial: piEnd },
                  { key: "cmrStart", label: "СМР: начало", type: "year", required: true, initial: cmrStart },
                  { key: "cmrEnd", label: "СМР: окончание", type: "year", required: true, initial: cmrEnd },
                  { key: "intro", label: "Год ввода в эксплуатацию", type: "year", locked: true, initial: intro },
                ],
              }}
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2 w-[30%]">Этап</th>
                <th className="text-left font-medium px-4 py-2">Начало</th>
                <th className="text-left font-medium px-4 py-2">Окончание</th>
                <th className="text-left font-medium px-4 py-2">Длительность</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              <StageRow label="ПИР" from={piStart} to={piEnd} />
              <StageRow label="СМР" from={cmrStart} to={cmrEnd} />
              <StageRow label="Ввод в эксплуатацию" from={intro} to={intro} point />
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground leading-relaxed">
          Сроки выводятся от базового года запуска. Точные даты корректируются в
          pop-up редактирования сроков.
        </div>
      </section>

      {/* 4. Базовые исходные ограничения */}
      <DataGroup
        title="Базовые исходные ограничения"
        editLabel="Изменить ограничения"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Базовые исходные ограничения",
          tabId: "source",
          fields: [
            { key: "protectedRoute", label: "Защищённый маршрут", type: "select", initial: project.protectedRoute ? "yes" : "no", options: [
              { value: "yes", label: "Да" },
              { value: "no", label: "Нет" },
            ] },
          ],
        }}
      >
        <DataRow label="Защищённый маршрут">
          <span className="inline-flex items-center gap-1.5">
            {project.protectedRoute ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-actual)]" />
                <span>Да</span>
              </>
            ) : (
              <span className="text-muted-foreground">Нет</span>
            )}
          </span>
        </DataRow>
        <DataRow label="Горизонт планирования сценария">
          <span className="font-mono tabular-nums">
            {scenario ? `${scenario.startYear}–${scenario.endYear}` : "—"}
          </span>
        </DataRow>
        <DataRow label="Год ввода относительно горизонта">
          <span className="text-muted-foreground">
            {scenario && project.commissionYear > scenario.endYear
              ? "За пределами горизонта"
              : scenario && project.commissionYear < scenario.startYear
                ? "До начала горизонта"
                : "В пределах горизонта"}
          </span>
        </DataRow>
      </DataGroup>

      {/* 5. Базовые проектные допущения */}
      <DataGroup
        title="Базовые проектные допущения"
        editLabel="Изменить допущения"
        editLocked={editLocked}
        editTitle={editTitle}
        note="Допущения формируют базу для расчётов спроса, инфраструктуры и финансовой модели."
        group={{
          groupTitle: "Базовые проектные допущения",
          tabId: "source",
          fields: [
            { key: "passengersMln", label: "Целевой пассажиропоток", type: "number", unit: "млн чел./год", min: 0, initial: project.passengersMln },
            { key: "populationMln", label: "Население в зоне тяготения", type: "number", unit: "млн чел.", min: 0, initial: project.populationMln },
            { key: "fleet", label: "Парк подвижного состава", type: "number", unit: "ед.", min: 0, initial: project.fleet },
            { key: "investmentBln", label: "Базовый объём инвестиций", type: "number", unit: "млрд руб.", min: 0, initial: project.investmentBln },
          ],
        }}
      >
        <DataRow label="Целевой пасс��жиропоток" changed={isChanged("passengersMln")}>
          <span className="font-mono tabular-nums">
            {project.passengersMln > 0
              ? `${project.passengersMln.toFixed(1).replace(".", ",")} млн чел./год`
              : "—"}
          </span>
        </DataRow>
        <DataRow label="Население в зоне тяготения" changed={isChanged("populationMln")}>
          <span className="font-mono tabular-nums">
            {project.populationMln > 0
              ? `${project.populationMln.toFixed(1).replace(".", ",")} млн чел.`
              : "—"}
          </span>
        </DataRow>
        <DataRow label="Парк подвижного состава" changed={isChanged("fleet")}>
          <span className="font-mono tabular-nums">
            {project.fleet > 0 ? `${project.fleet} ед.` : "—"}
          </span>
        </DataRow>
        <DataRow label="Базовый объём инвестиций" changed={isChanged("investmentBln")}>
          <span className="font-mono tabular-nums">
            {project.investmentBln > 0
              ? `${Math.round(project.investmentBln).toLocaleString("ru-RU")} млрд руб.`
              : "—"}
          </span>
        </DataRow>
      </DataGroup>
    </div>
  );
}

function DataGroup({
  title,
  editLabel,
  editLocked,
  editTitle,
  note,
  children,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  note?: string;
  children: React.ReactNode;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <dl className="divide-y divide-[var(--border-soft)] text-xs">{children}</dl>
      {note && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground leading-relaxed">
          {note}
        </div>
      )}
    </section>
  );
}

function DataRow({
  label,
  children,
  lockedField,
  changed,
}: {
  label: string;
  children: React.ReactNode;
  lockedField?: boolean;
  changed?: boolean;
}) {
  return (
    <div className="grid grid-cols-[260px_1fr_auto] items-center gap-3 px-4 py-2">
      <dt className="text-muted-foreground inline-flex items-center gap-1.5">
        {label}
        {changed && (
          <span
            aria-label="Значение изменено"
            title="Значение изменено в текущей сессии"
            className="w-1.5 h-1.5 rounded-full bg-[var(--status-stale)]"
          />
        )}
      </dt>
      <dd className="text-foreground min-w-0 truncate">{children}</dd>
      {lockedField ? (
        <span
          title="Поле зафиксировано документацией и не редактируется"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground"
        >
          <Lock className="w-3 h-3" />
          Фиксировано
        </span>
      ) : (
        <span aria-hidden />
      )}
    </div>
  );
}

function StageRow({
  label,
  from,
  to,
  point,
}: {
  label: string;
  from: number;
  to: number;
  point?: boolean;
}) {
  const duration = point ? "—" : `${Math.max(0, to - from)} лет`;
  return (
    <tr>
      <td className="px-4 py-2">
        <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          {label}
        </span>
      </td>
      <td className="px-4 py-2 font-mono tabular-nums">{from}</td>
      <td className="px-4 py-2 font-mono tabular-nums">{point ? "—" : to}</td>
      <td className="px-4 py-2 font-mono tabular-nums text-muted-foreground">
        {duration}
      </td>
    </tr>
  );
}

/* ----------------------------- Passenger Transportation ----------------------------- */

function PassengerTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка данных пассажирских перевозок" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить данные пассажирских перевозок."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — производные показатели готовятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Производные показатели вкладки недоступны." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования параметров спроса";

  // Forecast horizon documented in spec as 2028–2050.
  const forecastStart = 2028;
  const forecastEnd = 2050;

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеПрогноз спроса, тарифные сценарии и размеры движения показаны как демонстрационные значения."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить пассажирские показатели."}
          </div>
        </div>
      )}

      {/* 1. График прогноза спроса 2028–2050 */}
      <section className="surface">
        <SubHeader
          title="Прогноз пассажирского спроса 2028–2050"
          inset
          right={
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {forecastStart}–{forecastEnd}
            </span>
          }
        />
        <div className="px-4 py-4">
          <div className="relative h-[260px]">
            {notCalculated ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                Прогноз спроса — демонстрационное значение сценария
              </div>
            ) : (
              <PassengerFlowChart
                project={project}
                scenario={{ startYear: forecastStart, endYear: forecastEnd }}
              />
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Ось X — годы прогнозного горизонта. Ось Y — пассажиропоток (млн чел./год).
            Демо-серии построены на базе пассажиропотока проекта и года ввода.
          </div>
        </div>
      </section>

      {/* 2. Таблица тарифных сценариев */}
      <PassengerTablePlaceholder
        title="Тарифные сценарии"
        editLabel="Изменить тарифы"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Тарифные сценарии",
          tabId: "passenger",
          fields: [
            { key: "baseRate", label: "Базовый тариф", type: "number", unit: "руб./пасс.-км", min: 0, required: true },
            { key: "elasticity", label: "Эластичность", type: "number", min: -5, max: 0 },
          ],
        }}
        columns={["Сценарий тарифа", "Базовый тариф, руб./пасс.-км", "Эластичность", "Билетная выручка, млрд руб."]}
        emptyHint={
          notCalculated
            ? "Тарифные сценарии — демонстрационные значения проекта."
            : "Тарифные сценарии будут получены из расчётного модуля."
        }
      />

      {/* 3. Таблица размеров движения */}
      <PassengerTablePlaceholder
        title="Размеры движения"
        editLabel="Изменить параметры движения"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Размеры движения",
          tabId: "passenger",
          fields: [
            { key: "trainPairsPeak", label: "Пар поездов в сутки (пик)", type: "number", unit: "пар", min: 0, required: true },
            { key: "trainPairsOff", label: "Пар поездов в сутки (вне пика)", type: "number", unit: "пар", min: 0 },
            { key: "carsPerTrain", label: "Состав", type: "number", unit: "вагонов", min: 6, max: 20 },
            { key: "trainCategory", label: "Категория поезда", type: "select", options: [
              { value: "vsm", label: "ВСМ" },
              { value: "express", label: "Экспресс" },
              { value: "intercity", label: "Межрегиональный" },
            ] },
          ],
        }}
        columns={["Период", "Пар поездов в сутки", "Категория поезда", "Состав, вагонов"]}
        emptyHint={
          notCalculated
            ? "Размеры движения — демонстрационные значения проекта."
            : "Итоговые размеры движения демонстрационная агрегация по проекту."
        }
      />

      {/* 4. Показатели загрузки */}
      <section className="surface">
        <SubHeader title="Показатели загрузки" inset />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          <LoadIndicatorCell label="Средняя загрузка состава" notCalculated={notCalculated} />
          <LoadIndicatorCell label="Коэффициент использования вместимости" notCalculated={notCalculated} />
          <LoadIndicatorCell label="Потребный парк подвижного состава" notCalculated={notCalculated} />
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          Значения формируются совместно с прогнозом спроса и размерами движения.
        </div>
      </section>

      {/* 5. Структура спроса по годам */}
      <PassengerTablePlaceholder
        title="Структура спроса по годам"
        editLabel="Изменить параметры спроса"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Сегментация пассажирского спроса",
          tabId: "passenger",
          fields: [
            { key: "shareBusiness", label: "Доля деловых поездок", type: "number", unit: "%", min: 0, max: 100 },
            { key: "sharePersonal", label: "Доля личных поездок", type: "number", unit: "%", min: 0, max: 100 },
            { key: "shareTourism", label: "Доля туристических поездок", type: "number", unit: "%", min: 0, max: 100 },
            { key: "induction", label: "Коэффициент индуцированного спроса", type: "number", min: 0, max: 1 },
          ],
        }}
        columns={["Год", "Деловые поездки", "Личные поездки", "Туризм", "Итого"]}
        emptyHint={
          notCalculated
            ? "Структура спроса — демонстрационные значения проекта."
            : "Разрез спроса формируется по горизонту прогноза."
        }
        footnote={
          scenario
            ? `Горизонт сценария: ${scenario.startYear}���${scenario.endYear}. Прогнозный горизонт спроса: 2028–2050.`
            : undefined
        }
      />
    </div>
  );
}

function PassengerTablePlaceholder({
  title,
  editLabel,
  editLocked,
  editTitle,
  columns,
  emptyHint,
  footnote,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  columns: string[];
  emptyHint: string;
  footnote?: string;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          {footnote}
        </div>
      )}
    </section>
  );
}

function LoadIndicatorCell({
  label,
  notCalculated,
}: {
  label: string;
  notCalculated: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3 flex flex-col gap-1.5 min-h-[88px]">
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-mono tabular-nums leading-none text-muted-foreground">
          —
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-auto">
        {notCalculated
          ? "Демонстрационное значение"
          : "Производный показатель сценария"}
      </div>
    </div>
  );
}

/* ----------------------------- Freight Transportation ----------------------------- */

function CargoTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<"table" | "chart">("table");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка данных грузовых перевозок" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить данные грузовых перевозок."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — грузовые показатели готовятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Грузовые показатели вкладки недоступны." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования параметров грузопотока";

  // Spec: график ИЛИ таблица грузопотока. Default to table (real B2B), allow toggle.
  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеГрузопоток, выручка и оценка вытеснения потоков показаны как демонстрационные значения."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить грузовые показатели."}
          </div>
        </div>
      )}

      {/* 1. Грузопоток — таблица или график */}
      <section className="surface">
        <SubHeader
          title="Грузопоток"
          inset
          right={
            <div className="flex items-center gap-2">
              <div className="inline-flex border border-[var(--border-soft)] rounded-md overflow-hidden">
                <ViewToggle
                  active={view === "table"}
                  onClick={() => setView("table")}
                  label="Таблица"
                />
                <ViewToggle
                  active={view === "chart"}
                  onClick={() => setView("chart")}
                  label="График"
                />
              </div>
              <CargoEditButton
                label="Изменить параметры грузопотока"
                editLocked={editLocked}
                editTitle={editTitle}
              />
            </div>
          }
        />
        {view === "table" ? (
          <CargoEmptyTable
            columns={["Год", "Объём перевозок, млн т", "Грузооборот, млрд ткм", "Изм. к базовой сети"]}
            emptyHint={
              notCalculated
                ? "Грузопоток — демонстрационные значения проекта."
                : "Серия грузопотока формируется расчётным модулем."
            }
            footnote={
              scenario
                ? `Горизонт сценария: ${scenario.startYear}–${scenario.endYear}.`
                : undefined
            }
          />
        ) : (
          <div className="px-4 py-4">
            <div className="relative h-[240px]">
              {notCalculated ? (
                <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                  Грузопоток — демонстрационное значение сценария
                </div>
              ) : (
                <CargoCompositionChart project={project} scenario={scenario} />
              )}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Демо-разрез грузопотока по группам грузов на горизонте сценария.
            </div>
          </div>
        )}
      </section>

      {/* 2. Структура грузов */}
      <CargoEmptySection
        title="Структура грузов"
        editLabel="Изменить структуру грузов"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Структура грузов",
          tabId: "cargo",
          fields: [
            { key: "share_bulk", label: "Доля массовых грузов", type: "number", unit: "%", min: 0, max: 100 },
            { key: "share_container", label: "Доля контейнерных", type: "number", unit: "%", min: 0, max: 100 },
          ],
        }}
        columns={["Группа грузов", "Объём, млн т", "Доля, %", "Тип ПС"]}
        emptyHint={
          notCalculated
            ? "Структура грузов — демонстрационные значения проекта."
            : "Распределение по группам демонстрационная агрегация по проекту."
        }
      />

      {/* 3. Влияние на пропускную способность */}
      <section className="surface">
        <SubHeader
          title="Влияние на пропускную способность"
          inset
          right={
            <span className="text-[11px] text-muted-foreground">
              Сводный разрез — детально на вкладке «Инфраструктура»
            </span>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          <CapacityCell label="Высвобождение пропускной способности" notCalculated={notCalculated} />
          <CapacityCell label="Резерв для грузового движения" notCalculated={notCalculated} />
          <CapacityCell label="Узкие места после реализации" notCalculated={notCalculated} />
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          Производные показатели сценария. Расчётная модель пропускной способности
          раскрывается на вкладке «Инфраструктура».
        </div>
      </section>

      {/* 4. Выручка */}
      <CargoEmptySection
        title="Выручка от грузовых перевозок"
        editLabel="Изменить тарифы и допущения"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Тарифы и выручка от грузовых перевозок",
          tabId: "cargo",
          fields: [
            { key: "avgTariff", label: "Сред��ий тариф", type: "number", unit: "руб./ткм", min: 0, required: true },
            { key: "indexationPct", label: "Индексация тарифа", type: "number", unit: "%/год", min: 0, max: 20 },
            { key: "discountShare", label: "Доля льготных тарифов", type: "number", unit: "%", min: 0, max: 100 },
          ],
        }}
        columns={["Год", "Выручка, млрд руб.", "Средний тариф, руб./ткм", "Доля грузовой выручки"]}
        emptyHint={
          notCalculated
            ? "Выручка — демонстрационные значения проекта."
            : "Расчёт выручки основан на грузопотоке и тарифных допущениях."
        }
        footnote="Сводные финансовые показатели — на вкладке «Финансовая модель»."
      />

      {/* 5. Перераспределение / вытеснение потоков */}
      <CargoEmptySection
        title="Перераспределение и вытеснение потоков"
        editLabel="Изменить параметры перераспределения"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Перераспределение грузопотоков",
          tabId: "cargo",
          fields: [
            { key: "modeShiftRoad", label: "Перевод с автотранспорта", type: "number", unit: "%", min: 0, max: 100 },
            { key: "modeShiftSea", label: "Перевод с морских/речных", type: "number", unit: "%", min: 0, max: 100 },
            { key: "diversionLossPct", label: "Потери на стыках", type: "number", unit: "%", min: 0, max: 50 },
          ],
        }}
        columns={["Направление", "Базовый поток, млн т", "После реализации, млн т", "Δ, млн т"]}
        emptyHint={
          notCalculated
            ? "Анализ перераспределения — демонстрационные значения проекта."
            : "Изменение маршрутов формируется расчётным модулем."
        }
      />
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function CargoEditButton({
  label,
  editLocked,
  editTitle,
  group,
}: {
  label: string;
  editLocked: boolean;
  editTitle: string;
  group?: EditGroup;
}) {
  const ctx = useEditEntry();
  // When wired via context AND a structured group is provided, the button is
  // enabled in user scenarios (opens edit dialog) and in system scenarios
  // (opens copy-required dialog). Hard lock only applies to msk-spb.
  const liveMode = !!ctx && !!group;
  const disabled = liveMode ? ctx!.isLockedHard : editLocked;
  const title = liveMode
    ? ctx!.isLockedHard
      ? editTitle
      : ctx!.isSystemScenario
        ? "Системный сценарий: будет предложено создать копию для редактирования."
        : `Открыть pop-up редактирования: ${label}`
    : editTitle;

  const handleClick = () => {
    if (!liveMode || disabled) return;
    ctx!.request(group!);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 border border-[var(--border-soft)] rounded-md transition-colors",
        disabled
          ? "text-muted-foreground/60 cursor-not-allowed"
          : "hover:bg-muted text-foreground",
      )}
    >
      <Pencil className="w-3 h-3" />
      {label}
    </button>
  );
}

function CargoEmptySection({
  title,
  editLabel,
  editLocked,
  editTitle,
  columns,
  emptyHint,
  footnote,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  columns: string[];
  emptyHint: string;
  footnote?: string;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <CargoEmptyTable columns={columns} emptyHint={emptyHint} footnote={footnote} />
    </section>
  );
}

function CargoEmptyTable({
  columns,
  emptyHint,
  footnote,
}: {
  columns: string[];
  emptyHint: string;
  footnote?: string;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          {footnote}
        </div>
      )}
    </>
  );
}

function CapacityCell({
  label,
  notCalculated,
}: {
  label: string;
  notCalculated: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3 flex flex-col gap-1.5 min-h-[88px]">
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-mono tabular-nums leading-none text-muted-foreground">
          —
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-auto">
        {notCalculated ? "Демонстрационное значение" : "Производный показатель сценария"}
      </div>
    </div>
  );
}

/* ----------------------------- Infrastructure ----------------------------- */

function InfraTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [section, setSection] = useState<
    "segments" | "stations" | "depots" | "capacity" | "bottlenecks" | "measures" | "readiness"
  >("segments");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка инфраструктурных данных" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить инфраструктурные данные."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — инфраструктурные показатели готовятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Инфраструктурные показатели недоступны." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования инфраструктурного блока";

  const subTabs: { id: typeof section; label: string }[] = [
    { id: "segments", label: "Перегоны" },
    { id: "stations", label: "Станции" },
    { id: "depots", label: "Депо" },
    { id: "capacity", label: "Баланс пропускной способности" },
    { id: "bottlenecks", label: "Узкие места" },
    { id: "measures", label: "Мероприятия развития" },
    { id: "readiness", label: "Стройготовность" },
  ];

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеПерегоны, станции, баланс пропускной способности и мероприятия — демонстрационные значения проекта."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить инфраструктурные показатели."}
          </div>
        </div>
      )}

      <div className="surface">
        <div
          role="tablist"
          aria-label="Инфраструктурные группы"
          className="flex flex-wrap gap-px bg-border"
        >
          {subTabs.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={section === s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "px-3 py-2 text-[11px] font-medium transition-colors",
                section === s.id
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border-soft)]">
          {section === "segments" && (
            <InfraEmptyTable
              edit={{ label: "Изменить перегоны", editLocked, editTitle }}
              group={{
                groupTitle: "Перегоны",
                tabId: "infra",
                fields: [
                  { key: "speedClass", label: "Класс скорости", type: "number", unit: "км/ч", min: 60 },
                  { key: "tracks", label: "Число главных путей", type: "number", min: 1, max: 4 },
                ],
              }}
              columns={["Перегон", "Длина, км", "Категория пути", "Класс скорости", "Пропускная способность"]}
              emptyHint={
                notCalculated
                  ? "Перегоны — демонстрационные значения проекта."
                  : "Состав перегонов демонстрационная агрегация по проекту."
              }
              footnote={`Маршрут: ${project.from} → ${project.to}, ${project.lengthKm.toLocaleString("ru-RU")} км.`}
            />
          )}

          {section === "stations" && (
            <InfraEmptyTable
              edit={{ label: "Изменить станции", editLocked, editTitle }}
              group={{
                groupTitle: "Станции",
                tabId: "infra",
                fields: [
                  { key: "stationCount", label: "Число станций", type: "number", min: 0 },
                  { key: "platformLength", label: "Длина платформ", type: "number", unit: "м", min: 200 },
                  { key: "stationClass", label: "Класс станции", type: "select", options: [
                    { value: "1", label: "I класс" },
                    { value: "2", label: "II класс" },
                    { value: "3", label: "III класс" },
                  ] },
                ],
              }}
              columns={["Станция", "Класс", "Платформ", "Путей", "Стыковка"]}
              emptyHint={
                notCalculated
                  ? "Список станций — демонстрационные значения проекта."
                  : "Состав станций формируется расчётным модулем."
              }
            />
          )}

          {section === "depots" && (
            <InfraEmptyTable
              edit={{ label: "Изменить депо", editLocked, editTitle }}
              group={{
                groupTitle: "Депо и обслуживание",
                tabId: "infra",
                fields: [
                  { key: "depotCount", label: "Число депо", type: "number", min: 0, max: 20 },
                  { key: "fleetCapacity", label: "Ёмкость отстоя", type: "number", unit: "ед.", min: 0 },
                  { key: "maintenanceLevel", label: "Уровень ТО", type: "select", options: [
                    { value: "to1", label: "ТО-1" },
                    { value: "to2", label: "ТО-2" },
                    { value: "tr", label: "ТР (текущий ремонт)" },
                    { value: "kr", label: "КР (капитальный ремонт)" },
                  ] },
                ],
              }}
              columns={["Депо", "Тип", "Привязка", "Ёмкость отстоя", "Виды ТО"]}
              emptyHint={
                notCalculated
                  ? "Депо и инфраструктура обслуживания — демонстрационные значения проекта."
                  : "Состав депо и параметры ТО формируются расчётным модулем."
              }
              footnote="Параметры обслуживания и потребность в депо — закрывают L4-37 / L4-38 / L4-39."
            />
          )}

          {section === "capacity" && (
            <div>
              <InfraSectionHeader
                title="Баланс пропускной способности"
                edit={{ label: "Изменить параметры баланса", editLocked, editTitle }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
                <CapacityCell label="Потребная пропускная способность" notCalculated={notCalculated} />
                <CapacityCell label="Расчётная пропускная способность" notCalculated={notCalculated} />
                <CapacityCell label="Резерв / дефицит" notCalculated={notCalculated} />
              </div>
              <div className="px-4 py-4 border-t border-[var(--border-soft)]">
                <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2">
                  Динамика баланса по контрольным срезам
                </div>
                <div className="relative h-[220px]">
                  {notCalculated ? (
                    <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                      График — демонстрационное значение сценария
                    </div>
                  ) : (
                    <CapacityBalanceChart project={project} />
                  )}
                </div>
              </div>
              <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
                Баланс рассчитывается по перегонам и станционной инфраструктуре проекта
                в составе сценария. Демо-серии — мок-данные на основе параметров проекта.
              </div>
            </div>
          )}

          {section === "bottlenecks" && (
            <InfraEmptyTable
              edit={{ label: "Изменить параметры участков", editLocked, editTitle }}
              columns={["Участок", "Тип ограничения", "Дефицит", "Период появления", "Связанное мероприятие"]}
              emptyHint={
                notCalculated
                  ? "Узкие места — демонстрационные значения проекта."
                  : "Перечень узких мест формируется по балансу пропускной способности."
              }
            />
          )}

          {section === "measures" && (
            <InfraEmptyTable
              edit={{ label: "Изменить мероприятия", editLocked, editTitle }}
              columns={["Мероприятие", "Объект", "Эффект на пропускную способность", "Период", "Стоимость, млрд руб."]}
              emptyHint={
                notCalculated
                  ? "Мероприятия развития — демонстрационные значения проекта."
                  : "Список мероприятий формируется расчётным модулем."
              }
              footnote="Стоимость мероприятий учитывается в CAPEX вкладки «Финансовая модель»."
            />
          )}

          {section === "readiness" && (
            <InfraEmptyTable
              edit={{ label: "Изменить стройготовность", editLocked, editTitle }}
              columns={["Участок", "Стадия", "Готовность, %", "Плановый срок", "Источник"]}
              emptyHint={
                notCalculated
                  ? "Стройготовность по участкам — демонстрационные значения проекта."
                  : "Сводка стройготовности формируется по участкам проекта."
              }
            />
          )}
        </div>
      </div>

      <TerrainBlock project={project} notCalculated={notCalculated} />

      <div className="text-[11px] text-muted-foreground">
        Раздел закрывает требования L1-2, L1-12, L4-47…L4-49, L4-74…L4-78, L4-85.
        {scenario && (
          <>
            {" "}Горизонт сценария: {scenario.startYear}–{scenario.endYear}.
          </>
        )}
      </div>
    </div>
  );
}

function InfraSectionHeader({
  title,
  edit,
}: {
  title: string;
  edit: { label: string; editLocked: boolean; editTitle: string };
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border-soft)]">
      <h3 className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {title}
      </h3>
      <CargoEditButton
        label={edit.label}
        editLocked={edit.editLocked}
        editTitle={edit.editTitle}
      />
    </div>
  );
}

function InfraEmptyTable({
  edit,
  columns,
  emptyHint,
  footnote,
  group,
}: {
  edit: { label: string; editLocked: boolean; editTitle: string };
  columns: string[];
  emptyHint: string;
  footnote?: string;
  group?: EditGroup;
}) {
  return (
    <div>
      <div className="flex items-center justify-end gap-3 px-4 py-2 border-b border-[var(--border-soft)]">
        <CargoEditButton
          label={edit.label}
          editLocked={edit.editLocked}
          editTitle={edit.editTitle}
          group={group}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          {footnote}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Financial Model ----------------------------- */

function FinanceTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка финансовой модели" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить финансовую модель."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — финансовые показатели готовятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Финансовые показатели недоступны." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования финансового блока";

  const horizonLabel = scenario
    ? `${scenario.startYear}–${scenario.endYear}`
    : "—";

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеP&L, FCF, CAPEX/OPEX и интегральные показатели показаны как демонстрационные значения."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить финансовые показатели."}
          </div>
        </div>
      )}

      {/* IRR / NPV — интегральные показатели проекта */}
      <section>
        <SubHeader title="Интегральные показатели проекта" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-[var(--border-soft)] rounded-md overflow-hidden">
          <FinanceKpiCell label="ЧДД (NPV)" unit="млрд руб." notCalculated={notCalculated} />
          <FinanceKpiCell label="ВНД (IRR)" unit="%" notCalculated={notCalculated} />
          <FinanceKpiCell label="Срок окупаемости" unit="лет" notCalculated={notCalculated} />
          <FinanceKpiCell label="Дисконт-ставка" unit="%" notCalculated={notCalculated} />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Показатели рассчитываются по горизонту сценария {horizonLabel}.
        </div>
      </section>

      {/* Сводная P&L */}
      <FinanceEmptySection
        title="Сводная P&L"
        editLabel="Изменить параметры P&L"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Допущения P&L и интегральных показателей",
          tabId: "finance",
          fields: [
            { key: "discountRate", label: "Дисконт-ставка", type: "number", unit: "%", min: 0, max: 25 },
            { key: "taxProfit", label: "Налог на прибыль", type: "number", unit: "%", min: 0, max: 35 },
            { key: "vatPct", label: "Эффективная ставка НДС", type: "number", unit: "%", min: 0, max: 25 },
            { key: "horizonYears", label: "Горизонт расчёта", type: "number", unit: "лет", min: 5, max: 50 },
          ],
        }}
        columns={["Год", "Выручка, млрд руб.", "OPEX, млрд руб.", "EBITDA, млрд руб.", "Чистая прибыль, млрд руб."]}
        emptyHint={
          notCalculated
            ? "P&L — демонстрационные значения проекта."
            : "Сводная P&L демонстрационная агрегация по проекту."
        }
      />

      {/* График FCF — Chart.js justified, but series come from backend */}
      <section className="surface">
        <SubHeader
          title="Свободный денежный поток (FCF)"
          inset
          right={
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
              {horizonLabel}
            </span>
          }
        />
        <div className="px-4 py-4">
          <div className="relative h-[220px]">
            {notCalculated ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                FCF — демонстрационное значение сценария
              </div>
            ) : (
              <FcfChart project={project} scenario={scenario} />
            )}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Ось X — годы горизонта сценария. Ось Y — FCF, млрд руб. Серия данных
            — демо-моки на основе CAPEX и года ввода.
          </div>
        </div>
      </section>

      {/* CAPEX */}
      <FinanceEmptySection
        title="CAPEX"
        editLabel="Изменить CAPEX"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "CAPEX",
          tabId: "finance",
          fields: [
            { key: "capexInfra", label: "CAPEX: инфраструктура", type: "number", unit: "млрд руб.", min: 0, initial: project.investmentBln },
            { key: "capexFleet", label: "CAPEX: подвижной состав", type: "number", unit: "млрд руб.", min: 0 },
          ],
        }}
        columns={["Год", "Инфраструктура, млрд руб.", "Подвижной состав, млрд руб.", "Прочие, млрд руб.", "Итого"]}
        emptyHint={
          notCalculated
            ? "CAPEX — демонстрационные значения проекта."
            : "Инвестиционные затраты демонстрационная агрегация по проекту."
        }
        footnote={`Базовый объём инвестиций проекта: ${
          project.investmentBln > 0
            ? Math.round(project.investmentBln).toLocaleString("ru-RU") + " млрд руб."
            : "—"
        }. Закрывает L4-36, L4-40, L4-83, L4-91, L4-92.`}
      />

      {/* OPEX */}
      <FinanceEmptySection
        title="OPEX"
        editLabel="Изменить OPEX"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Эксплуатационные затраты (OPEX)",
          tabId: "finance",
          fields: [
            { key: "opexOperation", label: "Эксплуатация инфраструктуры", type: "number", unit: "млрд руб./год", min: 0 },
            { key: "opexFleet", label: "Содержание подвижного состава", type: "number", unit: "млрд руб./год", min: 0 },
            { key: "opexEnergy", label: "Энергоресурсы", type: "number", unit: "млрд руб./год", min: 0 },
            { key: "opexAdmin", label: "Управление и прочие", type: "number", unit: "млрд руб./год", min: 0 },
            { key: "opexIndexationPct", label: "Индексация OPEX", type: "number", unit: "%/год", min: 0, max: 15 },
          ],
        }}
        columns={["Год", "Эксплуатация, млрд руб.", "Содержание ПС, млрд руб.", "Содержание инфра., млрд руб.", "Итого"]}
        emptyHint={
          notCalculated
            ? "OPEX — демонстрационные значения проекта."
            : "Эксплуатационные затраты демонстрационная агрегация по проекту."
        }
        footnote="Закрывает L4-93 (содержание и ремонт инфраструктуры СМ)."
      />

      <FinancingSchemeBlock
        project={project}
        notCalculated={notCalculated}
        isStale={isStale}
      />

      <SensitivityBlock
        project={project}
        notCalculated={notCalculated}
        isStale={isStale}
      />
    </div>
  );
}

function FinanceKpiCell({
  label,
  unit,
  notCalculated,
}: {
  label: string;
  unit: string;
  notCalculated: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3 flex flex-col gap-1.5 min-h-[88px]">
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-mono tabular-nums leading-none text-muted-foreground">
          —
        </span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-auto">
        {notCalculated ? "Демонстрационное значение" : "Производный показатель сценария"}
      </div>
    </div>
  );
}

function FinanceEmptySection({
  title,
  editLabel,
  editLocked,
  editTitle,
  columns,
  emptyHint,
  footnote,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  columns: string[];
  emptyHint: string;
  footnote?: string;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          {footnote}
        </div>
      )}
    </section>
  );
}

/* ----------------------------- Socio-economic Effects ----------------------------- */

function SocialTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка социально-экономических эффектов" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить блок эффектов."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — эффекты гот��вятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Эффекты недоступны." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования допущений эффекта";

  const horizonLabel = scenario
    ? `${scenario.startYear}–${scenario.endYear}`
    : "—";

  // Documented project-level anchors — shown as known baseline values, not as new KPIs.
  const gdpValue =
    project.gdpTrln > 0
      ? `${project.gdpTrln.toFixed(2).replace(".", ",")} трлн руб.`
      : "—";
  const popValue =
    project.populationMln > 0
      ? `${project.populationMln.toFixed(1).replace(".", ",")} млн чел.`
      : "—";

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеЭффекты на смежные отрасли, туризм и занятость показаны как демонстрационные значения."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы обновить значения эффектов."}
          </div>
        </div>
      )}

      {/* 1. KPI-карточки эффектов — рендерим как структурный реестр (а не плотный strip) */}
      <section className="surface">
        <SubHeader
          title="Реестр эффектов проекта"
          inset
          right={
            <span className="text-[11px] text-muted-foreground">
              Горизонт: {horizonLabel}
            </span>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2 w-[40%]">Эффект</th>
                <th className="text-left font-medium px-4 py-2">Значение</th>
                <th className="text-left font-medium px-4 py-2">Источник</th>
                <th className="text-left font-medium px-4 py-2">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              <EffectRow
                name="Прирост ВВП в зоне влияния"
                value={gdpValue}
                source="Проектные допущения сценария"
                ready={project.gdpTrln > 0 && !notCalculated}
                notCalculated={notCalculated}
              />
              <EffectRow
                name="Население в зоне влияния"
                value={popValue}
                source="Проектные допущения сценария"
                ready={project.populationMln > 0 && !notCalculated}
                notCalculated={notCalculated}
              />
              <EffectRow
                name="Влияние на смежные отрасли"
                value="—"
                source="Расчётный модуль"
                ready={false}
                notCalculated={notCalculated}
              />
              <EffectRow
                name="Туризм"
                value="—"
                source="Расчётный модуль"
                ready={false}
                notCalculated={notCalculated}
              />
              <EffectRow
                name="Занятость / рабочие места"
                value="—"
                source="Расчётный модуль"
                ready={false}
                notCalculated={notCalculated}
              />
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          Реестр эффектов — структурный, без агрегированной плотной плашки KPI карты сети.
        </div>
      </section>

      {/* 2. Карта мобильности / зоны влияния — Leaflet placeholder */}
      <section className="surface">
        <SubHeader
          title="Карта мобильности и зоны влияния"
          inset
          right={
            <CargoEditButton
              label="Изменить параметры зон"
              editLocked={editLocked}
              editTitle={editTitle}
            />
          }
        />
        <div className="px-4 py-4">
          <div className="relative border border-dashed border-[var(--border-soft)] rounded-sm bg-muted/20 h-[260px] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
                Структурная заглушка карты
              </div>
              <div className="text-xs text-foreground/80 max-w-md">
                Карта зон влияния строится средствами Leaflet после получения
                расчётных слоёв тяготения и мобильности. Маршрут проекта:{" "}
                <span className="font-mono">{project.from} → {project.to}</span>.
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Слои зон тяготения, изохрон и плотности населения формируются расчётным модулем.
          </div>
        </div>
      </section>

      {/* 3. Таблица влияния на смежные отрасли */}
      <SocialEmptySection
        title="Влияние на смежные отрасли"
        editLabel="Изменить параметры отраслей"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Эффекты по смежным отраслям",
          tabId: "social",
          fields: [
            { key: "indirectMultiplier", label: "Мультипликатор косвенных эффектов", type: "number", min: 0, max: 5 },
            { key: "constructionGdp", label: "Эффект строительства на ВРП", type: "number", unit: "трлн руб." },
            { key: "operationGdp", label: "Эффект эксплуатации на ВРП", type: "number", unit: "трлн руб." },
          ],
        }}
        columns={["Отрасль", "Эффект, млрд руб.", "Тип эффекта", "Период"]}
        emptyHint={
          notCalculated
            ? "Эффекты по отраслям — демонстрационные значения проекта."
            : "Распределение эффектов формируется расчётным модулем."
        }
      />

      {/* 4. Туризм */}
      <SocialEmptySection
        title="Туризм"
        editLabel="Изменить туристические допущения"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Туристические допущения",
          tabId: "social",
          fields: [
            { key: "tourismShare", label: "Доля туристических поездок", type: "number", unit: "%", min: 0, max: 100 },
          ],
        }}
        columns={["Показатель", "Значение", "Год", "Источник"]}
        emptyHint={
          notCalculated
            ? "Туристические эффекты — демонстрационные значения проекта."
            : "Показатели туризма формируются расчётным модулем."
        }
      />

      {/* 5. Занятость / рабочие места */}
      <SocialEmptySection
        title="Занятость и рабочие места"
        editLabel="Изменить параметры занятости"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Занятость и рабочие места",
          tabId: "social",
          fields: [
            { key: "constructionJobs", label: "Рабочие места (строительство)", type: "number", unit: "тыс. чел.", min: 0 },
            { key: "operationJobs", label: "Рабочие места (эксплуатация)", type: "number", unit: "тыс. чел.", min: 0 },
            { key: "directShare", label: "Доля прямой занятости", type: "number", unit: "%", min: 0, max: 100 },
            { key: "regionFocus", label: "Опорный регион", type: "select", options: [
              { value: "central", label: "Центральный ФО" },
              { value: "northwest", label: "Северо-Западный ФО" },
              { value: "south", label: "Южный ФО" },
              { value: "ural", label: "Уральский ФО" },
              { value: "siberia", label: "Сибирский ФО" },
              { value: "fareast", label: "Дальневосточный ФО" },
            ] },
          ],
        }}
        columns={["Категория", "Период строительства", "Период эксплуатации", "Регион"]}
        emptyHint={
          notCalculated
            ? "Эффекты занятости — демонстрационные значения проекта."
            : "Показатели занятости формируются расчётным модулем."
        }
      />
    </div>
  );
}

function EffectRow({
  name,
  value,
  source,
  ready,
  notCalculated,
}: {
  name: string;
  value: string;
  source: string;
  ready: boolean;
  notCalculated: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-2 text-foreground">{name}</td>
      <td className="px-4 py-2 font-mono tabular-nums">
        <span className={cn(!ready && "text-muted-foreground")}>{value}</span>
      </td>
      <td className="px-4 py-2 text-muted-foreground">{source}</td>
      <td className="px-4 py-2">
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide",
            ready
              ? "bg-[var(--status-actual)]/10 text-[var(--status-actual)] border-[var(--status-actual)]/30"
              : notCalculated
                ? "bg-muted text-muted-foreground border-[var(--border-soft)]"
                : "bg-[var(--status-stale)]/10 text-[var(--status-stale)] border-[var(--status-stale)]/30",
          )}
        >
          {ready ? "Актуально" : notCalculated ? "Не рассчитано" : "Ожидает данных"}
        </span>
      </td>
    </tr>
  );
}

function SocialEmptySection({
  title,
  editLabel,
  editLocked,
  editTitle,
  columns,
  emptyHint,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  columns: string[];
  emptyHint: string;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ----------------------------- Stakeholders & Risks ----------------------------- */

function RisksTab({
  project,
  scenario,
  calcStatus,
  isSystemScenario,
  isLockedName,
}: {
  project: ProjectGeo;
  scenario: ScenarioSummary | null;
  calcStatus: CalcStatus;
  isSystemScenario: boolean;
  isLockedName: boolean;
}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setLoadState("loading");
    const t = setTimeout(() => setLoadState("ready"), 200);
    return () => clearTimeout(t);
  }, [project.id]);

  if (loadState === "loading") {
    return <LoadingState label="Загрузка участников и рисков" />;
  }
  if (loadState === "error") {
    return (
      <ErrorState
        message="Не удалось загрузить участников и риски."
        onRetry={() => setLoadState("loading")}
      />
    );
  }

  const isCalculating = calcStatus === "in_calculation";
  const hasError = calcStatus === "calculation_error";
  const isStale = calcStatus === "stale_after_changes";
  const notCalculated = calcStatus === "not_calculated";

  if (isCalculating) {
    return <LoadingState label="Идёт расчёт сценария — данные раздела готовятся" />;
  }
  if (hasError) {
    return (
      <ErrorState message="Ошибка расчёта сценария. Раздел недоступен." />
    );
  }

  const editLocked = isSystemScenario || isLockedName;
  const editTitle = isSystemScenario
    ? "Системный сценарий не редактируется. Создайте копию."
    : isLockedName
      ? "Москва — Санкт-Петербург: редактирование недоступно."
      : "Открыть pop-up редактирования блока";

  return (
    <div className="space-y-5 max-w-[1600px]">
      {(isStale || notCalculated) && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
          <Info className="w-4 h-4 text-[var(--status-stale)] shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            {notCalculated
              ? "В прототипеПроизводные оценки рисков и распределение ролей — демонстрационные значения проекта."
              : "Данные сценария устарели после изменений. Перезапустите расчёт, чтобы синхронизировать оценки."}
          </div>
        </div>
      )}

      {isSystemScenario && (
        <div className="flex items-start gap-2 px-3 py-2 border border-[var(--border-soft)] bg-muted/30 rounded-sm text-xs">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-foreground/90">
            Системный сценарий: прямое редактирование участников и рисков недоступно.
            Для внесения изменений создайте ��ользовательскую копию сценария.
          </div>
        </div>
      )}

      {/* 1. Таблица участников */}
      <RisksEmptySection
        title="Участники проекта"
        editLabel="Изменить состав участников"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Участники проекта",
          tabId: "risks",
          fields: [
            { key: "leadOrg", label: "Головной исполнитель", type: "text", required: true },
            { key: "investorPartner", label: "Соинвестор / концессионер", type: "text" },
            { key: "designOrg", label: "Проектная организация", type: "text" },
            { key: "regionalAuthority", label: "Региональный орган власти", type: "text" },
            { key: "engagementStage", label: "Этап вовлечения", type: "select", options: [
              { value: "design", label: "Проектирование" },
              { value: "construction", label: "СМР" },
              { value: "operation", label: "Эксплуатация" },
              { value: "lifecycle", label: "Полный жизненный цикл" },
            ] },
          ],
        }}
        columns={["Участник", "Тип организации", "Этап вовлечения", "Контактное лицо"]}
        emptyHint={
          notCalculated
            ? "Состав участников — демонстрационные значения проекта."
            : "Состав участников формируется по проектным данным."
        }
      />

      {/* 2. Роли и зоны ответственности */}
      <RisksEmptySection
        title="Роли и зоны ответственности"
        editLabel="Изменить распределение ролей"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "RACI распределение",
          tabId: "risks",
          fields: [
            { key: "raciResponsible", label: "Ответственный (R)", type: "text" },
            { key: "raciAccountable", label: "Утверждающий (A)", type: "text" },
            { key: "raciConsulted", label: "Консультируемые (C)", type: "text" },
            { key: "raciInformed", label: "Информируемые (I)", type: "text" },
          ],
        }}
        columns={["Роль", "Участник", "Зона ответственности", "Этапы"]}
        emptyHint={
          notCalculated
            ? "Распределение ролей — демонстрационные значения проекта."
            : "Распределение ролей формируется по проектным данным."
        }
      />

      {/* 3. Реестр рисков */}
      <RisksEmptySection
        title="Реестр рисков"
        editLabel="Изменить реестр рисков"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Реестр рисков",
          tabId: "risks",
          fields: [
            { key: "topRiskProb", label: "Вероятность ключевого риска", type: "number", min: 1, max: 5 },
            { key: "topRiskImpact", label: "Влияние ключевого риска", type: "number", min: 1, max: 5 },
          ],
        }}
        columns={["ID", "Риск", "Категория", "Вероятность", "Влияние", "Уровень"]}
        emptyHint={
          notCalculated
            ? "Реестр рисков — демонстрационные значения проекта."
            : "Реестр рисков формируется по проектным данным."
        }
        footnote="Уровень риска рассчитывается как произведение вероятности и влияния по шкале 1–5."
      />

      {/* 4. Матрица рисков 5x5 — структурный каркас, без значений */}
      <section className="surface">
        <SubHeader
          title="Матрица рисков 5×5"
          inset
          right={
            <CargoEditButton
              label="Изменить порог уровней"
              editLocked={editLocked}
              editTitle={editTitle}
            />
          }
        />
        <div className="px-4 py-4">
          <RiskMatrix notCalculated={notCalculated} />
          <div className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
            Ось X — вероятность (1…5). Ось Y — влияние (1…5). Размещение рисков на
            матрице выполняется после получения значений из реестра.
          </div>
        </div>
      </section>

      {/* 5. Меры реагирования */}
      <RisksEmptySection
        title="Меры реагирования"
        editLabel="Изменить меры реагирования"
        editLocked={editLocked}
        editTitle={editTitle}
        group={{
          groupTitle: "Меры реагирования на риски",
          tabId: "risks",
          fields: [
            { key: "responseStrategy", label: "Стратегия реагирования", type: "select", options: [
              { value: "avoid", label: "Уклонение" },
              { value: "mitigate", label: "Снижение" },
              { value: "transfer", label: "Передача" },
              { value: "accept", label: "Принятие" },
            ] },
            { key: "mitigationBudget", label: "Бюджет мер", type: "number", unit: "млрд руб.", min: 0 },
            { key: "reviewPeriod", label: "Периодичность пересмотра", type: "select", options: [
              { value: "monthly", label: "Ежемесячно" },
              { value: "quarterly", label: "Ежеквартально" },
              { value: "yearly", label: "Ежегодно" },
            ] },
          ],
        }}
        columns={["ID риска", "Стратегия", "Мера", "Ответственный", "Срок"]}
        emptyHint={
          notCalculated
            ? "Меры реагирования — демонстрационные значения проекта."
            : "Меры реагирования формируют��я по проектным данным."
        }
      />

      <div className="text-[11px] text-muted-foreground">
        Раздел не содержит отдельного workflow управления рисками: используется
        структурный каркас по спецификации.
        {scenario && <> Горизонт сценария: {scenario.startYear}–{scenario.endYear}. Проект: {project.name}.</>}
      </div>
    </div>
  );
}

function RiskMatrix({ notCalculated }: { notCalculated: boolean }) {
  const levels = [1, 2, 3, 4, 5];
  // Severity tiers per cell (probability × impact). Reference colour scale only.
  const tier = (prob: number, impact: number) => {
    const v = prob * impact;
    if (v >= 15) return "bg-[var(--status-error)]/20 border-[var(--status-error)]/30";
    if (v >= 8) return "bg-[var(--status-stale)]/20 border-[var(--status-stale)]/30";
    return "bg-[var(--status-actual)]/10 border-[var(--status-actual)]/20";
  };
  return (
    <div className="inline-grid grid-cols-[auto_repeat(5,minmax(56px,1fr))] gap-px text-[11px]">
      <div />
      {levels.map((p) => (
        <div
          key={`h-${p}`}
          className="px-2 py-1 text-center font-mono tabular-nums text-muted-foreground"
        >
          P{p}
        </div>
      ))}
      {[...levels].reverse().map((impact) => (
        <RiskMatrixRow
          key={`r-${impact}`}
          impact={impact}
          probabilities={levels}
          tier={tier}
          notCalculated={notCalculated}
        />
      ))}
    </div>
  );
}

function RiskMatrixRow({
  impact,
  probabilities,
  tier,
  notCalculated,
}: {
  impact: number;
  probabilities: number[];
  tier: (p: number, i: number) => string;
  notCalculated: boolean;
}) {
  return (
    <>
      <div className="px-2 py-1 text-right font-mono tabular-nums text-muted-foreground">
        I{impact}
      </div>
      {probabilities.map((p) => (
        <div
          key={`${p}-${impact}`}
          className={cn(
            "border h-10 flex items-center justify-center rounded-sm",
            tier(p, impact),
          )}
        >
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            {notCalculated ? "—" : "0"}
          </span>
        </div>
      ))}
    </>
  );
}

function RisksEmptySection({
  title,
  editLabel,
  editLocked,
  editTitle,
  columns,
  emptyHint,
  footnote,
  group,
}: {
  title: string;
  editLabel: string;
  editLocked: boolean;
  editTitle: string;
  columns: string[];
  emptyHint: string;
  footnote?: string;
  group?: EditGroup;
}) {
  return (
    <section className="surface">
      <SubHeader
        title={title}
        inset
        right={
          <CargoEditButton
            label={editLabel}
            editLocked={editLocked}
            editTitle={editTitle}
            group={group}
          />
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left font-medium px-4 py-2 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[11px] text-muted-foreground"
              >
                {emptyHint}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {footnote && (
        <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
          {footnote}
        </div>
      )}
    </section>
  );
}

/* ----------------------------- Pieces ----------------------------- */

function SubHeader({
  title,
  right,
  inset,
}: {
  title: string;
  right?: React.ReactNode;
  inset?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        inset
          ? "px-4 py-2 border-b border-[var(--border-soft)]"
          : "mb-2",
      )}
    >
      <h3 className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {title}
      </h3>
      {right}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right min-w-0 truncate">{children}</dd>
    </div>
  );
}

/* ----------------------------- Shell wrapper ----------------------------- */

function ShellFrame({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5 pb-3 border-b border-[var(--border-soft)] bg-card">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Назад
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-6 py-6">{children}</div>
    </div>
  );
}
