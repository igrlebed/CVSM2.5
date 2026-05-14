import { cn } from "../../lib/cn";
import {
  SCENARIO_COMPARE_TABS,
  type ScenarioCompareTabId,
} from "../../lib/scenarioCompare";

interface Props {
  activeTab: ScenarioCompareTabId;
  onChange: (tab: ScenarioCompareTabId) => void;
}

export function ScenarioCompareTabs({ activeTab, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 surface p-1 overflow-auto">
      {SCENARIO_COMPARE_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md whitespace-nowrap transition-all",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          aria-pressed={activeTab === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
