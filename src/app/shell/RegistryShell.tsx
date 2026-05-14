import { Outlet } from "react-router";
import { UserCircle2 } from "lucide-react";
import BrandLogo from "../../imports/BrandLogo/BrandLogo";

export function RegistryShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="shrink-0 bg-card sticky top-0 z-30"
        style={{
          height: "48px",
          boxShadow: "0 1px 0 var(--border-soft), 0 2px 8px rgba(14,21,35,0.04)",
        }}
      >
        <div className="h-full flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 32, height: 20 }}>
              <BrandLogo />
            </div>
            <div
              className="text-sm font-semibold text-foreground"
              style={{ letterSpacing: "-0.01em" }}
            >
              Модель развития сети СМ/ВСМ
            </div>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md nav-pill">
            <UserCircle2 className="w-4 h-4" />
            Аккаунт
          </button>
        </div>
      </header>
      <main className="flex-1 min-h-0 fm-rise">
        <Outlet />
      </main>
    </div>
  );
}
