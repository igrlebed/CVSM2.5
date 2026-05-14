import type { Column } from "../../primitives/DataTable";
import { DataTable } from "../../primitives/DataTable";
import { getDiffCellStatus, type ScenarioCompareDataset, type ScenarioProjectDiffRow } from "../../lib/scenarioCompare";

interface Props {
  rows: ScenarioProjectDiffRow[];
  datasets: ScenarioCompareDataset[];
  onlyDifferences: boolean;
}

export function ProjectDiffTable({ rows, datasets, onlyDifferences }: Props) {
  const visibleRows = onlyDifferences
    ? rows.filter((row) => row.hasDifferences)
    : rows;

  const columns: Column<ScenarioProjectDiffRow>[] = [
    {
      key: "project",
      header: "Проект",
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{row.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {row.type} · {row.route}
          </div>
        </div>
      ),
    },
    ...datasets.map<Column<ScenarioProjectDiffRow>>((dataset) => ({
      key: dataset.scenario.id,
      header: dataset.scenario.name,
      render: (row) => {
        const project = row.valuesByScenario[dataset.scenario.id] ?? null;
        return (
          <div className="min-w-[120px]">
            <div className="font-medium">{getDiffCellStatus(project)}</div>
            {project ? (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {project.commissionYear} · {project.investmentBln.toLocaleString("ru-RU")} млрд ₽
              </div>
            ) : (
              <div className="mt-0.5 text-[11px] text-muted-foreground">—</div>
            )}
          </div>
        );
      },
    })),
    {
      key: "tag",
      header: "Отличие",
      width: "160px",
      render: (row) => row.differenceTag,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={visibleRows}
      rowKey={(row) => row.key}
      dense
    />
  );
}
