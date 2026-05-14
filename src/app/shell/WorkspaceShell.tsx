import { useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import {
  ChevronDown,
  Info,
  UserCircle2,
  Check,
  Lock,
  ArrowUpRight,
  Search,
} from "lucide-react";
import { useScenario } from "../state/ScenarioContext";
import { Popover } from "../overlays/Popover";
import { StatusBadge } from "../primitives/StatusBadge";
import { ScenarioInfoDrawer } from "../screens/ScenarioInfoDrawer";
import { QuickExportModal } from "../overlays/QuickExportModal";
import type { ScenarioSummary } from "../types";
import { cn } from "../lib/cn";
import BrandLogo from "../../imports/BrandLogo/BrandLogo";

const SECTIONS = [
  { to: "/map",      label: "Карта сети" },
  { to: "/projects", label: "Проекты" },
  { to: "/compare",  label: "Сравнение" },
  { to: "/ranking",  label: "Ранжирование" },
];

const SECTION_ROOTS = ["/map", "/projects", "/compare", "/ranking"];

function preserveRouteFor(pathname: string): string {
  for (const root of SECTION_ROOTS) {
    if (pathname === root) return pathname;
  }
  return "/map";
}

export function WorkspaceShell() {
  const { activeScenario, scenarios, setActiveScenario } = useScenario();
  const navigate = useNavigate();
  const location = useLocation();
  const [infoOpen, setInfoOpen]       = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [query, setQuery]             = useState("");

  const visibleScenarios = useMemo(() => {
    const list = scenarios.filter((s) => !s.archived);
    const q = query.trim().toLowerCase();
    if (q.length === 0) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q),
    );
  }, [scenarios, query]);

  if (!activeScenario) {
    return <Navigate to="/" replace />;
  }

  const handlePick = (s: ScenarioSummary) => {
    if (activeScenario?.id !== s.id) {
      setActiveScenario(s.id);
    }
    setSwitcherOpen(false);
    setQuery("");
    const target = preserveRouteFor(location.pathname);
    if (target !== location.pathname) {
      navigate(target);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ── Shell header ─────────────────────────────────────────────────── */}
      <header
        className="shrink-0 bg-card"
        style={{
          height: "48px",
          boxShadow: "0 1px 0 var(--border-soft), 0 2px 8px rgba(14,21,35,0.04)",
        }}
      >
        <div className="h-full flex items-center justify-between px-4 gap-4">
          {/* Left — brand + scenario switcher */}
          <div className="flex items-center gap-2 min-w-0" style={{ flex: "0 0 auto" }}>
            {/* Brand */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-2 py-1 -ml-1 rounded-md nav-pill"
              aria-label="К реестру сценариев"
            >
              <div style={{ width: 32, height: 20 }}>
                <BrandLogo />
              </div>
              <span
                className="text-sm font-semibold text-foreground"
                style={{ letterSpacing: "-0.01em" }}
              >
                Модель развития сети СМ/ВСМ
              </span>
            </button>

            {/* Divider */}
            <div
              className="shrink-0"
              style={{ width: 1, height: 18, background: "var(--border)" }}
            />

            {/* Scenario switcher */}
            <Popover
              open={switcherOpen}
              onOpenChange={(o) => {
                setSwitcherOpen(o);
                if (!o) setQuery("");
              }}
              className="p-0 min-w-[360px] w-[360px]"
              trigger={
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md max-w-[300px] nav-pill text-xs",
                    switcherOpen ? "bg-muted" : "",
                  )}
                  aria-label="Переключить сценарий"
                >
                  {activeScenario?.type === "system" && (
                    <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-muted-foreground shrink-0" style={{ fontSize: 11 }}>
                    Сценарий:
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {activeScenario?.name ?? "—"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform shrink-0",
                      switcherOpen && "rotate-180",
                    )}
                  />
                </button>
              }
            >
              {/* Active scenario info */}
              <div
                className="px-3 py-2.5"
                style={{ borderBottom: "1px solid var(--border-soft)" }}
              >
                <div
                  className="text-[10px] font-medium text-muted-foreground mb-1"
                  style={{ letterSpacing: "0.02em" }}
                >
                  Активный сценарий
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {activeScenario?.type === "system" && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="text-sm font-medium truncate flex-1">
                    {activeScenario?.name ?? "—"}
                  </div>
                  {activeScenario && (
                    <StatusBadge status={activeScenario.calcStatus} compact />
                  )}
                </div>
              </div>

              {/* Search */}
              <div
                className="px-3 py-2"
                style={{ borderBottom: "1px solid var(--border-soft)" }}
              >
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по названию или автору"
                    className="w-full bg-[var(--surface)] rounded-md pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    style={{ border: "none" }}
                  />
                </div>
              </div>

              {/* Section label */}
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Доступные сценарии
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {visibleScenarios.length}
                </span>
              </div>

              {/* List */}
              {visibleScenarios.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  {scenarios.length === 0
                    ? "Доступные сценарии не загружены."
                    : "Ничего не найдено."}
                </div>
              ) : (
                <ul className="max-h-[280px] overflow-auto py-1">
                  {visibleScenarios.map((s) => {
                    const active = activeScenario?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => handlePick(s)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 rounded-md mx-1",
                            "hover:bg-muted transition-colors",
                            active && "bg-muted/60",
                          )}
                          style={{ width: "calc(100% - 8px)" }}
                        >
                          <span className="w-3.5 shrink-0 flex items-center justify-center">
                            {active && (
                              <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                            )}
                          </span>
                          {s.type === "system" && (
                            <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium truncate flex-1">{s.name}</span>
                          <span
                            className="text-[10px] text-muted-foreground shrink-0"
                          >
                            {s.type === "system" ? "Сист." : "Польз."}
                          </span>
                          <StatusBadge status={s.calcStatus} compact />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div style={{ borderTop: "1px solid var(--border-soft)" }}>
                <button
                  onClick={() => {
                    setSwitcherOpen(false);
                    setQuery("");
                    navigate("/");
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Открыть реестр сценариев
                </button>
              </div>
            </Popover>
          </div>

          {/* Center — main navigation */}
          <nav className="flex items-center gap-0.5" style={{ flex: "0 0 auto" }}>
            {SECTIONS.map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    "hover:bg-muted",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground",
                  )
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>

          {/* Right — utilities cluster */}
          <div className="flex items-center gap-1" style={{ flex: "0 0 auto" }}>
            <button
              onClick={() => activeScenario && setInfoOpen(true)}
              disabled={!activeScenario}
              title="Информация о сценарии"
              aria-label="Информация о сценарии"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md nav-pill disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Инфо</span>
            </button>

            <div
              className="shrink-0"
              style={{ width: 1, height: 18, background: "var(--border)" }}
            />

            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md nav-pill">
              <UserCircle2 className="w-4 h-4" />
              <span className="hidden lg:inline">Аккаунт</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col fm-rise">
        <Outlet />
      </main>

      <ScenarioInfoDrawer
        scenario={infoOpen ? activeScenario : null}
        onOpenChange={setInfoOpen}
      />
      <QuickExportModal />
    </div>
  );
}