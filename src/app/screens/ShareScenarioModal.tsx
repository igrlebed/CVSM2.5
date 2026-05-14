import { useMemo, useState } from "react";
import {
  Send,
  Lock,
  Link as LinkIcon,
  Copy as CopyIcon,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "../overlays/Modal";
import { ToolbarButton } from "../primitives/Toolbar";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";

type InviteStatus = "sent" | "accepted" | "error";

interface Invite {
  id: string;
  email: string;
  status: InviteStatus;
  invitedAt: string;
}

interface Props {
  scenario: ScenarioSummary | null;
  onOpenChange: (open: boolean) => void;
}

const SEED_BY_SCENARIO: Record<string, Invite[]> = {};

export function ShareScenarioModal({ scenario, onOpenChange }: Props) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (scenario && seededFor !== scenario.id) {
    setSeededFor(scenario.id);
    setInvites(SEED_BY_SCENARIO[scenario.id] ?? []);
    setEmail("");
    setTouched(false);
  }

  const trimmed = email.trim();
  const error = useMemo(() => {
    if (trimmed.length === 0) return "Укажите e-mail получателя.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Некорректный формат e-mail.";
    if (invites.some((i) => i.email.toLowerCase() === trimmed.toLowerCase()))
      return "Этот пользователь уже приглашён.";
    return null;
  }, [trimmed, invites]);

  const sendInvite = () => {
    if (error || submitting) return;
    setSubmitting(true);
    const next: Invite = {
      id: `i-${Date.now().toString(36)}`,
      email: trimmed,
      status: "sent",
      invitedAt: new Date().toISOString().slice(0, 10),
    };
    setInvites((prev) => [next, ...prev]);
    setEmail("");
    setTouched(false);
    setSubmitting(false);
  };

  const revoke = (id: string) =>
    setInvites((prev) => prev.filter((i) => i.id !== id));

  const handleClose = () => {
    onOpenChange(false);
    setSeededFor(null);
  };

  const counts = useMemo(() => {
    const c: Record<InviteStatus, number> = { sent: 0, accepted: 0, error: 0 };
    invites.forEach((i) => {
      c[i.status]++;
    });
    return c;
  }, [invites]);

  return (
    <Modal
      open={!!scenario}
      onOpenChange={(o) => !o && handleClose()}
      title="Управление доступом к сценарию"
      description="Сценарий доступен по приглашению. Получатель авторизуется и видит сценарий согласно правам своего аккаунта."
      size="md"
      footer={
        <ToolbarButton variant="outline" onClick={handleClose}>
          Закрыть
        </ToolbarButton>
      }
    >
      {scenario && (
        <div className="space-y-5">
          <section className="surface-soft">
            <div className="px-3 py-1.5 border-b border-[var(--border-soft)] text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
              Сценарий
            </div>
            <div className="px-3 py-2 flex items-center gap-2">
              {scenario.type === "system" && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{scenario.name}</span>
              <span
                className={cn(
                  "ml-auto inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide",
                  scenario.type === "system"
                    ? "bg-primary/5 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-[var(--border-soft)]",
                )}
              >
                {scenario.type === "system" ? "Системный" : "Пользовательский"}
              </span>
            </div>
          </section>

          <section>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Прямая ссылка
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 surface px-2.5 py-1.5 min-w-0">
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <code className="text-xs font-mono truncate">
                  {`https://tsvsm.rzd.ru/scenarios/${scenario.id}`}
                </code>
              </div>
              <ToolbarButton variant="outline">
                <CopyIcon className="w-3.5 h-3.5" />
                Копировать
              </ToolbarButton>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Открытие ссылки требует авторизации. Права доступа определяются аккаунтом получателя.
            </div>
          </section>

          <section>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground mb-1.5">
              Пригласить по e-mail
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setTouched(true);
                      sendInvite();
                    }
                  }}
                  placeholder="user@rzd.ru"
                  className={cn(
                    "w-full bg-card border rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                    touched && error ? "border-[var(--status-error)]" : "border-[var(--border-soft)]",
                  )}
                />
                {touched && error && (
                  <div className="mt-1 text-[11px] text-[var(--status-error)]">{error}</div>
                )}
              </div>
              <ToolbarButton
                variant="solid"
                onClick={() => {
                  setTouched(true);
                  sendInvite();
                }}
                disabled={!!error || submitting}
              >
                <Send className="w-3.5 h-3.5" />
                Отправить приглашение
              </ToolbarButton>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
                Список доступа
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground tabular-nums">
                <span>
                  Принято: <span className="text-[var(--status-actual)]">{counts.accepted}</span>
                </span>
                <span>
                  Отправлено: <span className="text-[var(--status-pending)]">{counts.sent}</span>
                </span>
                <span>
                  Ошибки: <span className="text-[var(--status-error)]">{counts.error}</span>
                </span>
              </div>
            </div>

            {invites.length === 0 ? (
              <div className="border border-dashed border-[var(--border-soft)] rounded-sm bg-card px-3 py-6 text-center text-xs text-muted-foreground">
                Доступ ещё никому не открыт. Отправьте приглашение по e-mail.
              </div>
            ) : (
              <ul className="surface divide-y divide-[var(--border-soft)]">
                {invites.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-3 px-3 py-2 text-xs"
                  >
                    <StatusIcon status={i.status} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{i.email}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums font-mono">
                        Приглашён: {i.invitedAt}
                      </div>
                    </div>
                    <StatusBadge status={i.status} />
                    <button
                      onClick={() => revoke(i.id)}
                      title="Отозвать доступ"
                      aria-label={`Отозвать доступ для ${i.email}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-muted-foreground hover:text-[var(--status-error)] hover:bg-[var(--status-error)]/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="border-t border-[var(--border-soft)] pt-3 text-[11px] text-muted-foreground leading-relaxed">
            Все события доступа фиксируются в change log сценария: создание приглашения, принятие, отзыв доступа.
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatusIcon({ status }: { status: InviteStatus }) {
  if (status === "accepted")
    return <CheckCircle2 className="w-4 h-4 text-[var(--status-actual)] shrink-0" />;
  if (status === "error")
    return <AlertTriangle className="w-4 h-4 text-[var(--status-error)] shrink-0" />;
  return <Clock className="w-4 h-4 text-[var(--status-pending)] shrink-0" />;
}

function StatusBadge({ status }: { status: InviteStatus }) {
  const map: Record<InviteStatus, { label: string; cls: string }> = {
    sent: {
      label: "Отправлено",
      cls: "bg-[var(--status-pending)]/10 text-[var(--status-pending)] border-[var(--status-pending)]/30",
    },
    accepted: {
      label: "Принято",
      cls: "bg-[var(--status-actual)]/10 text-[var(--status-actual)] border-[var(--status-actual)]/30",
    },
    error: {
      label: "Ошибка доставки",
      cls: "bg-[var(--status-error)]/10 text-[var(--status-error)] border-[var(--status-error)]/30",
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 border rounded-sm text-[10px] font-medium uppercase tracking-wide shrink-0",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}
