import { AppRouter } from "./router";
import { ScenarioProvider } from "./state/ScenarioContext";
import { ProjectsProvider } from "./state/ProjectsContext";
import { ProjectEditsProvider } from "./state/ProjectEditsContext";
import { CompareProvider } from "./state/CompareContext";
import { RankingProvider } from "./state/RankingContext";
import { ExportProvider } from "./state/ExportContext";
import { ToastProvider } from "./state/ToastContext";

export default function App() {
  return (
    <ScenarioProvider>
      <ProjectsProvider>
        <ProjectEditsProvider>
        <CompareProvider>
        <RankingProvider>
          <ExportProvider>
            <ToastProvider>
              <div className="size-full min-h-screen text-foreground bg-background">
                <AppRouter />
              </div>
            </ToastProvider>
          </ExportProvider>
        </RankingProvider>
        </CompareProvider>
        </ProjectEditsProvider>
      </ProjectsProvider>
    </ScenarioProvider>
  );
}
