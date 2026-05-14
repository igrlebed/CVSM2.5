import { Lock } from "lucide-react";
import { Drawer } from "../overlays/Drawer";
import { ToolbarButton } from "../primitives/Toolbar";
import { StatusBadge } from "../primitives/StatusBadge";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";
import { useScenario } from "../state/ScenarioContext";
import { getScenarioCompareGate, getStatusLabel } from "../lib/scenarioCompare";

interface Props {
  scenario: ScenarioSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioInfoDrawer({ scenario, onOpenChange }: Props) {
  const { scenarios } = useScenario();
  const approvedScenario =
    scenarios.find((item) => item.id === "approved") ?? null;

  const sourceScenario =
    scenario?.sourceScenarioId
      ? scenarios.find((item) => item.id === scenario.sourceScenarioId) ?? null
      : null;
  const gate = scenario ? getScenarioCompareGate(scenario) : null;

  return (
    <Drawer
      open={!!scenario}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title="Информация о сценарии"
      width="380px"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Только просмотр
          </span>
          <ToolbarButton variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </ToolbarButton>
        </div>
      }
    >
      {scenario && (
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-2 min-w-0">
            {scenario.type === "system" && (
              <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-0.5">
                Название
              </div>
              <div className="text-sm font-semibold leading-snug break-words">
                {scenario.name}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <TypeBadge type={scenario.type} />
                <StatusBadge status={scenario.calcStatus} />
                {scenario.archived && (
                  <span className="inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide bg-[var(--status-stale)]/10 text-[var(--status-stale)] border-[var(--status-stale)]/30">
                    В архиве
                  </span>
                )}
              </div>
            </div>
          </div>

          <Section label="Описание">
            {scenario.description ? (
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                {scenario.description}
              </p>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Описание не задано.
              </span>
            )}
          </Section>

          <Section label="Атрибуты">
            <dl className="surface divide-y divide-[var(--border-soft)] text-xs">
              <Row label="Тип" value={scenario.type === "system" ? "Системный" : "Пользовательский"} />
              <Row label="Автор" value={scenario.author} />
              <Row
                label="Горизонт планирования"
                value={`${scenario.startYear} – ${scenario.endYear}`}
                mono
              />
              <Row label="Статус данных" value={getStatusLabel(scenario.calcStatus)} />
              <Row label="Кол-во проектов" value={scenario.projectCount} mono />
              <Row label="Дата создания" value={scenario.createdAt} mono />
              <Row label="Дата изменения" value={scenario.updatedAt} mono />
              {sourceScenario && (
                <Row label="Источник сценария" value={sourceScenario.name} />
              )}
              {approvedScenario && (
                <Row
                  label="Отличие от утверждённого"
                  value={formatApprovedDelta(
                    scenario.projectCount - approvedScenario.projectCount,
                  )}
                />
              )}
            </dl>
          </Section>

          {(gate?.warning || gate?.baselineCaution || gate?.blockingReason) && (
            <Section label="Комментарий по статусу данных">
              <div className="surface px-3 py-2 text-xs leading-relaxed text-foreground/85">
                {gate?.warning ?? gate?.baselineCaution ?? gate?.blockingReason}
              </div>
            </Section>
          )}

          <div className="border-t border-[var(--border-soft)] pt-3 text-[11px] text-muted-foreground leading-relaxed">
            Сводка предоставляется в режиме «только чтение». Управление сценарием доступно из реестра и из контекстного меню действий.
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
        {label}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground tabular-nums", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function TypeBadge({ type }: { type: ScenarioSummary["type"] }) {
  const isSystem = type === "system";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide",
        isSystem
          ? "bg-primary/5 text-primary border-primary/20"
          : "bg-muted text-muted-foreground border-[var(--border-soft)]",
      )}
    >
      {isSystem ? "Системный" : "Пользовательский"}
    </span>
  );
}

function formatApprovedDelta(delta: number) {
  if (delta === 0) return "Как в утверждённом";
  return `${delta > 0 ? "+" : ""}${delta} проект(ов) к утверждённому`;
}
