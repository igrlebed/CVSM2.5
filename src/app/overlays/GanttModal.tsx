import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Modal } from "./Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { EmptyState } from "../primitives/States";
import { TYPE_COLOR, type ProjectGeo } from "../map/projectsData";

/** Three documented stages per spec: ПИР, СМР, Ввод */
type StageKey = "pir" | "smr" | "vvod";

interface StageDef {
  key: StageKey;
  label: string;
  /** Fraction of time between projectStart and launch year */
  from: number;
  to: number;
  tone: "dashed" | "solid" | "thick";
}

const STAGE_DEFS: StageDef[] = [
  { key: "pir",  label: "ПИР", from: 0,    to: 0.2,  tone: "dashed" },
  { key: "smr",  label: "СМР", from: 0.2,  to: 0.9,  tone: "solid"  },
  { key: "vvod", label: "Ввод", from: 0.9,  to: 1.0,  tone: "thick"  },
];

interface ComputedRow {
  project: ProjectGeo;
  projectStart: number;
  launch: number;
  stages: { def: StageDef; start: number; end: number }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectGeo[];
  scenarioName: string;
  scenarioStart: number;
  scenarioEnd: number;
}

export function GanttModal({
  open,
  onOpenChange,
  projects,
  scenarioName,
  scenarioStart,
  scenarioEnd,
}: Props) {
  const span = Math.max(1, scenarioEnd - scenarioStart);

  const rows = useMemo<ComputedRow[]>(() => {
    return projects
      .slice()
      .sort((a, b) => a.commissionYear - b.commissionYear)
      .map((p) => {
        const launch = p.commissionYear;
        const projectStart = Math.max(scenarioStart, launch - 8);
        const duration = launch - projectStart;
        const stages = STAGE_DEFS.map((def) => ({
          def,
          start: Math.round(projectStart + duration * def.from),
          end:   Math.round(projectStart + duration * def.to),
        }));
        // Ввод ends exactly at launch
        stages[stages.length - 1].end = launch;
        return { project: p, projectStart, launch, stages };
      });
  }, [projects, scenarioStart, scenarioEnd]);

  const yearTicks = useMemo(() => {
    const step = span <= 15 ? 2 : span <= 30 ? 5 : 10;
    const ticks: number[] = [];
    for (let y = scenarioStart; y <= scenarioEnd; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== scenarioEnd) ticks.push(scenarioEnd);
    return ticks;
  }, [scenarioStart, scenarioEnd, span]);

  const toPct = (year: number) =>
    `${Math.max(0, Math.min(100, ((year - scenarioStart) / span) * 100))}%`;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpandedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const expandAll = () => setExpandedIds(new Set(rows.map((r) => r.project.id)));
  const collapseAll = () => setExpandedIds(new Set());

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Гант проектов сценария"
      description={`${scenarioName} · горизонт ${scenarioStart}–${scenarioEnd}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <ToolbarButton variant="ghost" onClick={expandAll}>Развернуть все</ToolbarButton>
            <ToolbarButton variant="ghost" onClick={collapseAll}>Свернуть все</ToolbarButton>
          </div>
          <ToolbarButton onClick={() => onOpenChange(false)}>Закрыть</ToolbarButton>
        </div>
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          title="Нет проектов в сценарии"
          description="Добавьте проекты в сценарий, чтобы увидеть стадии на ленте времени."
        />
      ) : (
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid gap-3 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-2"
            style={{ gridTemplateColumns: "260px 1fr" }}>
            <div className="pl-6">Проект</div>
            <div className="relative h-4">
              {yearTicks.map((y) => (
                <span
                  key={y}
                  className="absolute -translate-x-1/2 tabular-nums"
                  style={{ left: toPct(y) }}
                >
                  {y}
                </span>
              ))}
            </div>
          </div>

          {/* Project rows */}
          {rows.map(({ project, projectStart, launch, stages }) => {
            const color = TYPE_COLOR[project.type];
            const expanded = expandedIds.has(project.id);
            return (
              <div key={project.id}>
                {/* Collapsed / summary row */}
                <div
                  className="grid gap-3 items-center group"
                  style={{ gridTemplateColumns: "260px 1fr" }}
                >
                  {/* Project label */}
                  <button
                    className="flex items-center gap-1.5 text-left min-w-0 px-1 py-0.5 rounded-sm hover:bg-muted/50 transition-colors"
                    onClick={() => toggle(project.id)}
                    title={expanded ? "Свернуть этапы" : "Раз��ернуть этапы"}
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {expanded
                        ? <ChevronDown className="w-3 h-3" />
                        : <ChevronRight className="w-3 h-3" />}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium truncate leading-tight" title={project.name}>
                        {project.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {projectStart}–{launch}
                      </div>
                    </div>
                  </button>

                  {/* Summary bar */}
                  <div className="relative h-6 bg-muted/30 rounded-sm">
                    {yearTicks.map((y) => (
                      <span
                        key={y}
                        aria-hidden
                        className="absolute top-0 bottom-0 w-px bg-border/40"
                        style={{ left: toPct(y) }}
                      />
                    ))}
                    {/* Full project span bar */}
                    <div
                      className="absolute top-1.5 bottom-1.5 rounded-sm opacity-30"
                      style={{
                        left: toPct(projectStart),
                        width: `calc(${toPct(launch)} - ${toPct(projectStart)})`,
                        backgroundColor: color,
                      }}
                    />
                    {/* Ввод marker */}
                    <div
                      aria-hidden
                      className="absolute top-0 bottom-0 w-0.5 rounded-full"
                      style={{ left: toPct(launch), backgroundColor: color }}
                      title={`Ввод в эксплуатацию: ${launch}`}
                    />
                  </div>
                </div>

                {/* Expanded stage rows */}
                {expanded && (
                  <div className="mt-0.5 mb-1 space-y-0.5 ml-1">
                    {stages.map(({ def, start, end }) => (
                      <div
                        key={def.key}
                        className="grid gap-3 items-center"
                        style={{ gridTemplateColumns: "260px 1fr" }}
                      >
                        {/* Stage label */}
                        <div className="flex items-center gap-2 pl-7 min-w-0">
                          <span
                            className="text-[10px] font-mono font-medium tabular-nums shrink-0"
                            style={{ color }}
                          >
                            {def.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                            {start}–{end}
                          </span>
                        </div>

                        {/* Stage bar */}
                        <div className="relative h-5 bg-muted/20 rounded-sm">
                          {yearTicks.map((y) => (
                            <span
                              key={y}
                              aria-hidden
                              className="absolute top-0 bottom-0 w-px bg-border/30"
                              style={{ left: toPct(y) }}
                            />
                          ))}
                          <div
                            className="absolute top-1 bottom-1 rounded-[2px]"
                            style={{
                              left: toPct(start),
                              width: `calc(${toPct(end)} - ${toPct(start)})`,
                              backgroundColor:
                                def.tone === "solid"
                                  ? color
                                  : def.tone === "thick"
                                    ? color
                                    : "transparent",
                              opacity: def.tone === "solid" ? 0.85 : def.tone === "thick" ? 1 : 1,
                              border: def.tone === "dashed" ? `1.5px dashed ${color}` : def.tone === "thick" ? `2px solid ${color}` : "none",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 mt-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
            <LegendItem tone="dashed" label="ПИР (проектно-изыскательские работы)" />
            <LegendItem tone="solid" label="СМР (строительно-монтажные работы)" />
            <LegendItem tone="thick" label="Ввод в эксплуатацию" />
            <span className="ml-auto text-[10px]">
              Стадии и сроки — демонстрационные данные на основе года ввода.
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function LegendItem({ tone, label }: { tone: "dashed" | "solid" | "thick"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-5 h-2.5 rounded-[2px]"
        style={{
          border: tone === "dashed"
            ? "1.5px dashed var(--foreground)"
            : tone === "thick"
              ? "2px solid var(--foreground)"
              : "none",
          background: tone === "solid" ? "var(--foreground)" : "transparent",
          opacity: 0.6,
        }}
      />
      {label}
    </span>
  );
}
