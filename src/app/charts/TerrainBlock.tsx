import { useMemo } from "react";
import { TerrainProfileChart, buildTerrainProfile } from "./ProjectCharts";
import type { ProjectGeo } from "../map/projectsData";

export function TerrainBlock({
  project,
  notCalculated,
}: {
  project: ProjectGeo;
  notCalculated: boolean;
}) {
  const { elevation } = useMemo(() => buildTerrainProfile(project), [project]);
  const min = useMemo(() => Math.min(...elevation), [elevation]);
  const max = useMemo(() => Math.max(...elevation), [elevation]);
  const avg = useMemo(
    () => Math.round(elevation.reduce((a, b) => a + b, 0) / elevation.length),
    [elevation],
  );

  return (
    <section className="border border-[var(--border-soft)] rounded-md bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-soft)]">
        <div>
          <div className="text-sm font-medium">Рельеф и высотный профиль трассы</div>
          <div className="text-[11px] text-muted-foreground">
            Демо-визуализация L4-84 — высотные отметки по километражу маршрута
            {project.from && project.to ? `: ${project.from} → ${project.to}.` : "."}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          demo / mock
        </span>
      </div>
      <div className="p-4">
        <div className="relative h-[220px]">
          {notCalculated ? (
            <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
              Высотный профиль доступен после расчёта
            </div>
          ) : (
            <TerrainProfileChart project={project} />
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-[var(--border-soft)] rounded-md overflow-hidden text-[11px]">
          <Stat label="Минимальная отметка" value={`${min} м`} muted={notCalculated} />
          <Stat label="Максимальная отметка" value={`${max} м`} muted={notCalculated} />
          <Stat label="Средняя отметка" value={`${avg} м`} muted={notCalculated} />
          <Stat
            label="Перепад высот"
            value={`${max - min} м`}
            muted={notCalculated}
          />
        </div>
      </div>
      <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
        Высотные отметки — мок-данные, сгенерированные на основе протяжённости
        проекта. Реальный профиль строится по геодезическим изысканиям.
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
        {label}
      </div>
      <div
        className={
          muted
            ? "mt-0.5 font-mono tabular-nums text-muted-foreground"
            : "mt-0.5 font-mono tabular-nums"
        }
      >
        {muted ? "—" : value}
      </div>
    </div>
  );
}
