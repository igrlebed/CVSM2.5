import { ArrowUpRight, CheckCircle2, Download, Link2 } from "lucide-react";
import type { ScenarioCompareDataset } from "../../lib/scenarioCompare";
import { ToolbarButton } from "../../primitives/Toolbar";

interface Props {
  datasets: ScenarioCompareDataset[];
  selectedScenarioId: string;
  onScenarioChange: (id: string) => void;
  onOpenScenario: () => void;
  onMakeActive: () => void;
  onShare: () => void;
  onExport: () => void;
}

export function ScenarioCompareUtilityRail({
  datasets,
  selectedScenarioId,
  onScenarioChange,
  onOpenScenario,
  onMakeActive,
  onShare,
  onExport,
}: Props) {
  return (
    <aside className="surface p-3 space-y-3">
      <div>
        <div className="text-[11px] font-medium text-muted-foreground mb-1">
          Действия
        </div>
        <div className="text-xs text-muted-foreground">
          Аналитический экран не меняет активный сценарий сам по себе. Действия ниже выполняются только по явному выбору.
        </div>
      </div>

      <label className="block">
        <div className="text-[11px] text-muted-foreground mb-1">Сценарий для действий</div>
        <select
          value={selectedScenarioId}
          onChange={(event) => onScenarioChange(event.target.value)}
          className="w-full bg-card border border-[var(--border)] rounded-md px-2.5 py-2 text-xs"
        >
          {datasets.map((dataset) => (
            <option key={dataset.scenario.id} value={dataset.scenario.id}>
              {dataset.scenario.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-2">
        <ToolbarButton variant="outline" onClick={onOpenScenario}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          Открыть сценарий
        </ToolbarButton>
        <ToolbarButton variant="outline" onClick={onMakeActive}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Сделать активным
        </ToolbarButton>
        <ToolbarButton variant="outline" onClick={onShare}>
          <Link2 className="w-3.5 h-3.5" />
          Поделиться ссылкой
        </ToolbarButton>
        <ToolbarButton variant="outline" onClick={onExport}>
          <Download className="w-3.5 h-3.5" />
          Экспорт текущей вкладки
        </ToolbarButton>
      </div>
    </aside>
  );
}
