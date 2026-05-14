import { Copy, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { useProjects } from "../state/ProjectsContext";
import { useScenario } from "../state/ScenarioContext";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";

interface Props {
  source: ScenarioSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function CopyScenarioDialog({ source, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { copyScenario, setActiveScenario } = useScenario();
  const { cloneScenarioProjects } = useProjects();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!source || submitting) return;
    setSubmitting(true);
    const id = copyScenario(source.id);
    if (id) {
      cloneScenarioProjects(source.id, id);
      setActiveScenario(id);
      onOpenChange(false);
      navigate("/map");
    }
    setSubmitting(false);
  };

  return (
    <Modal
      open={!!source}
      onOpenChange={(o) => !o && onOpenChange(false)}
      title="Копирование сценария"
      description="Будет создан пользовательский сценарий с собственным жизненным циклом. Исходный сценарий не изменяется."
      size="sm"
      footer={
        <>
          <ToolbarButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Отмена
          </ToolbarButton>
          <ToolbarButton variant="solid" onClick={handleConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Копирование…
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Создать копию и открыть
              </>
            )}
          </ToolbarButton>
        </>
      }
    >
      {source && (
        <div className="space-y-4">
          <section className="surface-soft">
            <div className="px-3 py-1.5 border-b border-[var(--border-soft)] text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              Исходный сценарий
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {source.type === "system" && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm truncate">{source.name}</span>
                <SourceBadge type={source.type} />
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <Row label="Автор" value={source.author} />
                <Row label="Кол-во проектов" value={source.projectCount} />
                <Row
                  label="Горизонт"
                  value={`${source.startYear} – ${source.endYear}`}
                  mono
                />
                <Row label="Дата изменения" value={source.updatedAt} mono />
              </dl>
            </div>
          </section>

          <section>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Что наследует копия
            </div>
            <ul className="surface divide-y divide-[var(--border-soft)] text-xs">
              <InheritItem label="Состав проектов" value={`${source.projectCount} шт.`} />
              <InheritItem
                label="Горизонт планирования"
                value={`${source.startYear} – ${source.endYear}`}
                mono
              />
              <InheritItem label="Описание сценария" value={source.description ? "сохраняется" : "не задано"} />
              <InheritItem label="Тип копии" value="Пользовательский" />
              <InheritItem label="Жизненный цикл" value="Новый scenarioId" />
            </ul>
            <div className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
              Изменения в копии не затрагивают исходный сценарий. После открытия копии вы попадёте на карту сети нового сценария.
            </div>
          </section>

          {source.type === "system" && (
            <div className="border-l-2 border-[var(--status-pending)] bg-[var(--status-pending)]/8 px-3 py-2 text-[11px] text-foreground/80">
              <span className="font-medium text-[var(--status-pending)]">Системный сценарий не редактируется напрямую.</span>{" "}
              Изменения возможны только в созданной копии.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground tabular-nums", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function InheritItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono tabular-nums")}>{value}</span>
    </li>
  );
}

function SourceBadge({ type }: { type: ScenarioSummary["type"] }) {
  const isSystem = type === "system";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide ml-auto shrink-0",
        isSystem
          ? "bg-primary/5 text-primary border-primary/20"
          : "bg-muted text-muted-foreground border-[var(--border-soft)]",
      )}
    >
      {isSystem ? "Системный" : "Пользовательский"}
    </span>
  );
}
