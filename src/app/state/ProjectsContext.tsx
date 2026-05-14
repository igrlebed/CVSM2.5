import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PROJECTS, type ProjectGeo } from "../map/projectsData";
import { useScenario } from "./ScenarioContext";

interface ProjectsContextValue {
  customProjectsByScenario: Record<string, ProjectGeo[]>;
  getScenarioProjects: (scenarioId: string | null) => ProjectGeo[];
  addProject: (scenarioId: string, project: ProjectGeo) => void;
  cloneScenarioProjects: (sourceScenarioId: string, targetScenarioId: string) => void;
  isCustom: (scenarioId: string | null, projectId: string) => boolean;
}

const Ctx = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const {
    scenarios,
    getScenarioProjectIds,
    setScenarioProjectCount,
  } = useScenario();
  const [customProjectsByScenario, setMap] = useState<Record<string, ProjectGeo[]>>({});

  const addProject = useCallback((scenarioId: string, project: ProjectGeo) => {
    setMap((prev) => {
      const list = prev[scenarioId] ?? [];
      if (list.some((item) => item.id === project.id)) return prev;
      return { ...prev, [scenarioId]: [...list, project] };
    });
  }, []);

  const cloneScenarioProjects = useCallback(
    (sourceScenarioId: string, targetScenarioId: string) => {
      setMap((prev) => {
        const sourceProjects = prev[sourceScenarioId] ?? [];
        if (sourceProjects.length === 0) return prev;
        const cloned = sourceProjects.map((project, index) => ({
          ...project,
          id: `${project.id}-${targetScenarioId}-${index}`,
          originScenarioId: project.originScenarioId ?? sourceScenarioId,
        }));
        return { ...prev, [targetScenarioId]: cloned };
      });
    },
    [],
  );

  const getScenarioProjects = useCallback(
    (scenarioId: string | null): ProjectGeo[] => {
      if (!scenarioId) return PROJECTS;
      const includedIds = new Set(getScenarioProjectIds(scenarioId));
      const systemProjects = PROJECTS.filter((project) => includedIds.has(project.id));
      const customProjects = customProjectsByScenario[scenarioId] ?? [];
      return [...systemProjects, ...customProjects];
    },
    [customProjectsByScenario, getScenarioProjectIds],
  );

  const isCustom = useCallback(
    (scenarioId: string | null, projectId: string) => {
      if (!scenarioId) return false;
      return (customProjectsByScenario[scenarioId] ?? []).some(
        (project) => project.id === projectId,
      );
    },
    [customProjectsByScenario],
  );

  useEffect(() => {
    scenarios.forEach((scenario) => {
      const count =
        getScenarioProjectIds(scenario.id).length +
        (customProjectsByScenario[scenario.id] ?? []).length;
      setScenarioProjectCount(scenario.id, count);
    });
  }, [
    scenarios,
    customProjectsByScenario,
    getScenarioProjectIds,
    setScenarioProjectCount,
  ]);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      customProjectsByScenario,
      getScenarioProjects,
      addProject,
      cloneScenarioProjects,
      isCustom,
    }),
    [
      customProjectsByScenario,
      getScenarioProjects,
      addProject,
      cloneScenarioProjects,
      isCustom,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProjects() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useProjects must be used inside ProjectsProvider");
  return value;
}
