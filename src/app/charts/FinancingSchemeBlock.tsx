import { useMemo } from "react";
import {
  FinancingPieChart,
  buildFinancingSources,
  type FinancingSource,
} from "./ProjectCharts";
import { FinancingDrawdownChart, DebtServiceChart } from "./AnalysisCharts";
import type { ProjectGeo } from "../map/projectsData";

export function FinancingSchemeBlock({
  project,
  notCalculated,
  isStale,
}: {
  project: ProjectGeo;
  notCalculated: boolean;
  isStale: boolean;
}) {
  const sources = useMemo<FinancingSource[]>(
    () => buildFinancingSources(project),
    [project],
  );
  const total = useMemo(
    () => sources.reduce((acc, s) => acc + s.amount, 0),
    [sources],
  );
  const muted = notCalculated;
  const launchYear = project.commissionYear;
  const drawdownStart = Math.max(2025, launchYear - 7);
  const drawdownEnd = launchYear;
  const debtSource = sources.find((s) => s.label.includes("Банковское"));
  const debtBln = debtSource ? debtSource.amount : Math.round(total * 0.18);
  const debtStart = launchYear + 1;
  const debtEnd = launchYear + 12;

  return (
    <section className="border border-[var(--border-soft)] rounded-md bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border-soft)]">
        <div>
          <div className="text-sm font-medium">Структура финансирования</div>
          <div className="text-[11px] text-muted-foreground">
            Распределение источников капитала по проекту (демо-версия модуля L1-16).
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          demo / mock
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-soft)]">
          <div className="relative h-[220px]">
            {muted ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                Доступно после расчёта
              </div>
            ) : (
              <FinancingPieChart sources={sources} />
            )}
          </div>
          <div className="mt-3 text-[11px] text-muted-foreground tabular-nums">
            Совокупная потребность в финансировании ·{" "}
            <span className="text-foreground">{total.toLocaleString("ru-RU")} млрд руб.</span>
          </div>
          {isStale && !muted && (
            <div className="mt-2 text-[11px] text-[var(--status-stale)]">
              Доли устарели после изменений сценария.
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-2">Источник</th>
                <th className="text-right font-medium px-4 py-2">Доля, %</th>
                <th className="text-right font-medium px-4 py-2">Сумма, млрд руб.</th>
                <th className="text-left font-medium px-4 py-2">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.label} className="border-t border-[var(--border-soft)] align-top">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.label}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {muted ? "—" : s.share.toFixed(1).replace(".", ",")}
                  </td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums">
                    {muted ? "—" : s.amount.toLocaleString("ru-RU")}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-muted-foreground">
                    {s.note}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-soft)] bg-muted/20">
                <td className="px-4 py-2 text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                  Итого
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {muted ? "—" : "100,0"}
                </td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">
                  {muted ? "—" : total.toLocaleString("ru-RU")}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-[var(--border-soft)]">
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-soft)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">График выборки CAPEX</div>
              <div className="text-[11px] text-muted-foreground">
                {drawdownStart} → {drawdownEnd} · колоколообразное распределение,
                пик в середине строительной фазы.
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              demo / mock
            </span>
          </div>
          <div className="relative h-[220px]">
            {muted ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                Доступно после расчёта
              </div>
            ) : (
              <FinancingDrawdownChart
                totalBln={total}
                startYear={drawdownStart}
                endYear={drawdownEnd}
              />
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-medium">Обслуживание долга</div>
              <div className="text-[11px] text-muted-foreground">
                {debtStart} → {debtEnd} · линейное погашение тела + проценты на
                остаток (банковское проектное финансирование).
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              demo / mock
            </span>
          </div>
          <div className="relative h-[220px]">
            {muted ? (
              <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground border border-dashed border-[var(--border-soft)] rounded-sm">
                Доступно после расчёта
              </div>
            ) : (
              <DebtServiceChart
                debtBln={debtBln}
                startYear={debtStart}
                endYear={debtEnd}
              />
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-[var(--border-soft)] text-[11px] text-muted-foreground">
        Демо-версия раздела L1-16 «Схема финансирования». Источники, доли,
        графики выборки и об��луживания долга — мок-данные, привязанные к
        базовому объёму инвестиций проекта.
      </div>
    </section>
  );
}