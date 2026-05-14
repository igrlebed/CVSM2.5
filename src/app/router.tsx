import { createBrowserRouter, RouterProvider } from "react-router";
import { RegistryShell } from "./shell/RegistryShell";
import { WorkspaceShell } from "./shell/WorkspaceShell";
import { RegistryScreen } from "./screens/RegistryScreen";
import { MapScreen } from "./screens/MapScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { ProjectCardScreen } from "./screens/ProjectCardScreen";
import { CompareScreen } from "./screens/CompareScreen";
import { RankingScreen } from "./screens/RankingScreen";
import { AdvancedExportScreen } from "./screens/AdvancedExportScreen";
import { NotFoundScreen } from "./screens/NotFoundScreen";
import { ScenarioCompareScreen } from "./screens/ScenarioCompareScreen";

const router = createBrowserRouter(
  [
    {
      element: <RegistryShell />,
      children: [
        { path: "/", element: <RegistryScreen /> },
        { path: "/registry/compare", element: <ScenarioCompareScreen /> },
      ],
    },
    {
      element: <WorkspaceShell />,
      children: [
        { path: "/map", element: <MapScreen /> },
        { path: "/projects", element: <ProjectsScreen /> },
        { path: "/projects/:id", element: <ProjectCardScreen /> },
        { path: "/compare", element: <CompareScreen /> },
        { path: "/ranking", element: <RankingScreen /> },
        { path: "/export/advanced", element: <AdvancedExportScreen /> },
      ],
    },
    { path: "*", element: <NotFoundScreen /> },
  ],
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
