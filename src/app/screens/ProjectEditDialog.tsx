import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, Lock } from "lucide-react";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { cn } from "../lib/cn";

export type EditFieldType = "text" | "number" | "year" | "select";

export interface EditField {
  key: string;
  label: string;
  type: EditFieldType;
  unit?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  initial?: string | number;
  // Per-field locked flag (not editable per spec, e.g. name / base launch year)
  locked?: boolean;
  helper?: string;
}

export interface EditGroup {
  groupTitle: string;
  groupDescription?: string;
  tabId:
    | "overview"
    | "source"
    | "passenger"
    | "cargo"
    | "infra"
    | "finance"
    | "social"
    | "risks";
  fields: EditField[];
}

type Phase = "idle" | "saving" | "in_calculation" | "done" | "error";

interface Props {
  open: boolean;
  group: EditGroup | null;
  onClose: () => void;
  onSave: (
    tabId: EditGroup["tabId"],
    changedKeys: string[],
    values: Record<string, string | number>,
  ) => void;
}

function validate(field: EditField, raw: string): string | null {
  if (field.locked) return null;
  const v = raw.trim();
  if (field.required && v === "") return "Поле обязательно";
  if (v === "") return null;
  if (field.type === "number" || field.type === "year") {
    const n = Number(v.replace(",", "."));
    if (Number.isNaN(n)) return "Ожидается число";
    if (field.min !== undefined && n < field.min)
      return `Минимум ${field.min}`;
    if (field.max !== undefined && n > field.max)
      return `Максимум ${field.max}`;
  }
  return null;
}

export function ProjectEditDialog({ open, group, onClose, onSave }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [phase, setPhase] = useState<Phase>("idle");

  // Reset on open / group change
  useEffect(() => {
    if (!group) return;
    const v: Record<string, string> = {};
    group.fields.forEach((f) => {
      v[f.key] = f.initial !== undefined ? String(f.initial) : "";
    });
    setValues(v);
    setErrors({});
    setPhase("idle");
  }, [group, open]);

  const initial = useMemo(() => {
    const v: Record<string, string> = {};
    group?.fields.forEach((f) => {
      v[f.key] = f.initial !== undefined ? String(f.initial) : "";
    });
    return v;
  }, [group]);

  if (!group) return null;

  const setField = (key: string, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: raw }));
    const f = group.fields.find((x) => x.key === key);
    if (f) setErrors((prev) => ({ ...prev, [key]: validate(f, raw) }));
  };

  const handleSave = () => {
    // Validate all
    const errMap: Record<string, string | null> = {};
    let hasError = false;
    for (const f of group.fields) {
      const err = validate(f, values[f.key] ?? "");
      errMap[f.key] = err;
      if (err) hasError = true;
    }
    setErrors(errMap);
    if (hasError) return;

    // Determine changed keys
    const changedKeys: string[] = [];
    for (const f of group.fields) {
      if (f.locked) continue;
      if ((values[f.key] ?? "") !== (initial[f.key] ?? "")) {
        changedKeys.push(f.key);
      }
    }
    if (changedKeys.length === 0) {
      onClose();
      return;
    }

    // Coerce values
    const out: Record<string, string | number> = {};
    for (const f of group.fields) {
      const raw = values[f.key] ?? "";
      if (f.type === "number" || f.type === "year") {
        out[f.key] = raw === "" ? "" : Number(raw.replace(",", "."));
      } else {
        out[f.key] = raw;
      }
    }

    setPhase("saving");
    // Mimic recalc pipeline: saving → in_calculation → done
    setTimeout(() => setPhase("in_calculation"), 250);
    setTimeout(() => {
      onSave(group.tabId, changedKeys, out);
      setPhase("done");
      // Close shortly after to let user see the state transition.
      setTimeout(onClose, 350);
    }, 1000);
  };

  const busy = phase === "saving" || phase === "in_calculation";

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && !busy && onClose()}
      title={`Редактирование: ${group.groupTitle}`}
      description={
        group.groupDescription ??
        "Локальное редактирование группы. Зависимые показатели будут пересчитаны после сохранения."
      }
      size="md"
      footer={
        <>
          <ToolbarButton variant="outline" onClick={onClose} disabled={busy}>
            Отмена
          </ToolbarButton>
          <ToolbarButton onClick={handleSave} disabled={busy}>
            {phase === "saving" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            {phase === "in_calculation" && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            {phase === "saving"
              ? "Сохранение…"
              : phase === "in_calculation"
                ? "Пересчёт сценария…"
                : phase === "done"
                  ? "Готово"
                  : "Сохранить и пересчитать"}
          </ToolbarButton>
        </>
      }
    >
      <div className="space-y-3">
        <div className="text-[11px] text-muted-foreground surface-soft px-3 py-2">
          Pop-up редактирует только эту группу данных. Параметры других вкладок
          доступны через свои локальные точки редактирования.
        </div>

        {phase === "in_calculation" && (
          <div className="flex items-start gap-2 px-3 py-2 border border-[var(--status-stale)]/30 bg-[var(--status-stale)]/10 rounded-sm text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--status-stale)] mt-0.5" />
            <div>Сценарий в расчёте. Зависимые показатели обновляются.</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {group.fields.map((f) => (
            <FieldRow
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              error={errors[f.key] ?? null}
              onChange={(v) => setField(f.key, v)}
              disabled={busy}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function FieldRow({
  field,
  value,
  error,
  onChange,
  disabled,
}: {
  field: EditField;
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const id = `edit-${field.key}`;
  const isLocked = field.locked;
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {field.label}
        {field.required && !isLocked && (
          <span className="text-[var(--status-error)]">*</span>
        )}
        {isLocked && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-mono"
            title="Поле зафиксировано документацией"
          >
            <Lock className="w-3 h-3" />
            Фиксировано
          </span>
        )}
        {field.unit && (
          <span className="text-[10px] font-mono">· {field.unit}</span>
        )}
      </span>
      {field.type === "select" ? (
        <select
          id={id}
          value={value}
          disabled={disabled || isLocked}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "px-2 py-1.5 border rounded-sm bg-card text-xs",
            error
              ? "border-[var(--status-error)]/50"
              : "border-[var(--border-soft)] focus:border-foreground",
            isLocked && "opacity-60 cursor-not-allowed",
          )}
        >
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type === "text" ? "text" : "number"}
          step={field.type === "year" ? 1 : "any"}
          inputMode={field.type === "text" ? "text" : "decimal"}
          value={value}
          disabled={disabled || isLocked}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "px-2 py-1.5 border rounded-sm bg-card text-xs",
            error
              ? "border-[var(--status-error)]/50"
              : "border-[var(--border-soft)] focus:border-foreground",
            isLocked && "opacity-60 cursor-not-allowed",
          )}
        />
      )}
      {field.helper && !error && (
        <span className="text-[10px] text-muted-foreground">{field.helper}</span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-[10px] text-[var(--status-error)]">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </span>
      )}
    </label>
  );
}

/* --------------------------- System-scenario gate --------------------------- */

export function CopyRequiredDialog({
  open,
  scenarioName,
  onCancel,
  onCopy,
}: {
  open: boolean;
  scenarioName?: string;
  onCancel: () => void;
  onCopy: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onCancel()}
      title="Системный сценарий не редактируется"
      description="Прямое редактирование системного сценария недоступно. Создайте копию, чтобы продолжить."
      size="sm"
      footer={
        <>
          <ToolbarButton variant="outline" onClick={onCancel}>
            Отмена
          </ToolbarButton>
          <ToolbarButton onClick={onCopy}>Создать копию и продолжить</ToolbarButton>
        </>
      }
    >
      <div className="text-xs text-foreground/90">
        Сценарий {scenarioName ? <strong>«{scenarioName}»</strong> : null} помечен
        как системный. Все дальнейшие правки выполняются в копии — копия
        наследует горизонт планирования и состав проектов.
      </div>
    </Modal>
  );
}
