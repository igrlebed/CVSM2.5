import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Modal } from "./Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import { useExport } from "../state/ExportContext";
import { useScenario } from "../state/ScenarioContext";
import type { ExportFormat, ExportContextSnapshot } from "../types";
import { cn } from "../lib/cn";

type Phase = "idle" | "preparing" | "done" | "error";

const FORMATS: {
  id: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileSpreadsheet;
}[] = [
  { id: "xlsx", label: "Excel", hint: "Табличные данные текущего экрана", icon: FileSpreadsheet },
  { id: "pdf", label: "PDF", hint: "Свёрстанный снимок текущего экрана", icon: FileText },
  { id: "png", label: "PNG", hint: "Растровый снимок видимой области", icon: ImageIcon },
];

const MODULE_LABEL: Record<ExportContextSnapshot["sourceModule"], string> = {
  map: "Карта сети",
  projects: "Проекты",
  project_card: "Карточка проекта",
  compare: "Сравнение",
  ranking: "Ранжирование",
  scenario_compare: "Сопоставление сценариев",
};

export function QuickExportModal() {
  const { quickOpen, quickSnapshot, closeQuickExport } = useExport();
  const { activeScenario } = useScenario();
  const navigate = useNavigate();
  const location = useLocation();

  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (quickOpen) {
      setFormat("xlsx");
      setPhase("idle");
      setErrorMsg(null);
    }
  }, [quickOpen]);

  const filterEntries = useMemo(() => {
    const f = quickSnapshot?.filters ?? {};
    return Object.entries(f).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    );
  }, [quickSnapshot?.filters]);

  const handleExport = () => {
    setPhase("preparing");
    setErrorMsg(null);
    window.setTimeout(() => {
      setPhase("done");
      window.setTimeout(() => closeQuickExport(), 700);
    }, 900);
  };

  const goAdvanced = () => {
    closeQuickExport();
    navigate("/export/advanced");
  };

  const sourceLabel = quickSnapshot
    ? MODULE_LABEL[quickSnapshot.sourceModule]
    : "Текущий экран";

  const busy = phase === "preparing";

  return (
    <Modal
      open={quickOpen}
      onOpenChange={(v) => !v && !busy && closeQuickExport()}
      title="Быстрый экспорт текущего экрана"
      description="Локальное действие. Снимок наследует текущий маршрут, фильтры и видимое состояние раздела."
      size="sm"
      footer={
        <>
          <button
            onClick={goAdvanced}
            disabled={busy}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
            title="Перейти в расширенный модуль экспорта"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Расширенный экспорт
          </button>
          <div className="flex-1" />
          <ToolbarButton variant="outline" onClick={closeQuickExport} disabled={busy}>
            Отмена
          </ToolbarButton>
          <ToolbarButton
            variant="solid"
            onClick={handleExport}
            disabled={busy || phase === "done"}
          >
            {phase === "preparing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {phase === "done" && <CheckCircle2 className="w-3.5 h-3.5" />}
            {phase === "preparing"
              ? "Подготовка…"
              : phase === "done"
                ? "Готово"
                : "Сформировать"}
          </ToolbarButton>
        </>
      }
    >
      <div className="space-y-4">
        <ContextStrip
          sourceLabel={sourceLabel}
          routePath={location.pathname}
          scenarioName={activeScenario?.name ?? "—"}
          selectionCount={quickSnapshot?.selection?.length ?? 0}
          filterEntries={filterEntries}
        />

        <div>
          <div className="text-[10px] font-medium text-muted-foreground mb-2">
            Формат — только Excel / PDF / PNG
          </div>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              const active = format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg text-left transition-all",
                    active
                      ? "bg-muted ring-1 ring-foreground/30"
                      : "bg-[var(--surface)] hover:bg-muted",
                    busy && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{f.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {f.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {phase === "error" && errorMsg && (
          <div
            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              background: "color-mix(in srgb, var(--status-error) 8%, transparent)",
              color: "var(--status-error)",
            }}
          >
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground rounded-lg bg-[var(--surface)] px-3 py-2">
          Быстрый экспорт не заменяет расширенный модуль. Для сборки многоразделного отчёта
          перейдите в расширенный экспорт.
        </div>
      </div>
    </Modal>
  );
}

function ContextStrip({
  sourceLabel,
  routePath,
  scenarioName,
  selectionCount,
  filterEntries,
}: {
  sourceLabel: string;
  routePath: string;
  scenarioName: string;
  selectionCount: number;
  filterEntries: [string, unknown][];
}) {
  return (
    <div className="rounded-lg bg-[var(--surface)] overflow-hidden">
      <Row k="Раздел" v={sourceLabel} />
      <Row k="Маршрут" v={routePath} mono />
      <Row k="Сценарий" v={scenarioName} />
      <Row
        k="Выбор"
        v={selectionCount > 0 ? `${selectionCount} элем.` : "—"}
      />
      <Row
        k="Фильтры"
        v={
          filterEntries.length === 0
            ? "—"
            : filterEntries
                .map(([k, v]) => `${k}: ${formatFilter(v)}`)
                .join(" · ")
        }
      />
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div
      className="grid grid-cols-[110px_1fr] gap-2 px-3 py-1.5 text-xs"
      style={{ borderBottom: "1px solid var(--border-soft)" }}
    >
      <span className="text-[10px] font-medium text-muted-foreground">{k}</span>
      <span className={cn("truncate", mono && "font-mono")} title={v}>
        {v}
      </span>
    </div>
  );
}

function formatFilter(v: unknown): string {
  if (Array.isArray(v)) return v.length === 0 ? "—" : v.join(", ");
  if (typeof v === "boolean") return v ? "да" : "нет";
  return String(v);
}
