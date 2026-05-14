import { useNavigate } from "react-router";
import { ToolbarButton } from "../primitives/Toolbar";

export function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-[11px] uppercase tracking-[0.12em] font-mono text-muted-foreground">
          404 · Маршрут не найден
        </div>
        <div className="text-sm">Запрошенный экран не существует в текущей версии системы.</div>
        <ToolbarButton variant="outline" onClick={() => navigate("/")}>
          Вернуться в реестр сценариев
        </ToolbarButton>
      </div>
    </div>
  );
}
