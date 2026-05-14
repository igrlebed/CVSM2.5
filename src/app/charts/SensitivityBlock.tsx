import { useMemo } from "react";
import {
  SensitivityTornadoChart,
  buildSensitivityFactors,
  type SensitivityFactor,
} from "./ProjectCharts";
import type { ProjectGeo } from "../map/projectsData";

export function SensitivityBlock({
  project,
  notCalculated,
  isStale,
}: {
  project: ProjectGeo;
  notCalculated: boolean;
  isStale: boolean;
}) {
  const factors = useMemo<SensitivityFactor[]>(
    () => buildSensitivityFactors(project),
    [project],
  );

  return (
    <section className="border border-[var(--border-soft)] rounded-md bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-soft)]">
        <div>
          <div className="text-sm font-medium">Анализ чувствительности ЧДД</div>
          <div className="text-[11px] text-muted-foreground">
            Влияние факторов на ЧДД (NPV) проекта при отклонении ±15 %.
            Расчёт ранжирования сценариев — отдельный модуль (TOPSIS).
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          demo / mock
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-soft)]">
          <div className="relative h-[320px]">
            {notCalculated ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                Чувствительность доступна после расчёта сценария
              </div>
            ) : (
              <SensitivityTornadoChart factors={factors} />
            )}
          </div>
          {isStale && !notCalculated && (
            <div className="mt-2 text-[11px] text-[var(--status-stale)]">
              Чувствительность пересчитывается после обновления сценария.
            </div>
          )}
        </div>
        <div className="p-4 space-y-3 text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
              Метод
            </div>
            <div className="text-foreground/85 leading-snug">
              One-factor-at-a-time. Каждый фактор отклоняется на ±15 % от
              базового значения, остальные — фиксированы.
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1">
              Топ-3 фактора
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-foreground/85">
              {factors.slice(0, 3).map((f) => (
                <li key={f.label} className="leading-snug">
                  <span className="font-medium">{f.label}</span> ·{" "}
                  <span className="font-mono tabular-nums">
                    {notCalculated ? "—" : `${f.low.toFixed(1)} … +${f.high.toFixed(1)} %`}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug pt-2 border-t border-[var(--border-soft)]">
            Не используется как метод ранжирования сценариев. Ранжирование
            работает исключительно по TOPSIS.
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
        Демо-версия аналитического блока чувствительности. Перечень факторов и
        диапазоны отклонений — мок-данные на основе типовых ВСМ-проектов.
      </div>
    </section>
  );
}
