import { createContext, useContext, useMemo, useState, ReactNode } from "react";

type TabId =
  | "overview"
  | "source"
  | "passenger"
  | "cargo"
  | "infra"
  | "finance"
  | "social"
  | "risks";

interface ProjectEditsValue {
  // Set of changed field keys per project per tab.
  markChanged: (projectId: string, tab: TabId, fields: string[]) => void;
  clearForProject: (projectId: string) => void;
  changedFields: (projectId: string, tab: TabId) => Set<string>;
  changedTabs: (projectId: string) => Set<TabId>;
  isFieldChanged: (projectId: string, tab: TabId, field: string) => boolean;
}

const Ctx = createContext<ProjectEditsValue | null>(null);

type Store = Record<string, Partial<Record<TabId, Set<string>>>>;

export function ProjectEditsProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({});

  const markChanged = (projectId: string, tab: TabId, fields: string[]) => {
    setStore((prev) => {
      const project = { ...(prev[projectId] ?? {}) };
      const next = new Set(project[tab] ?? []);
      fields.forEach((f) => next.add(f));
      project[tab] = next;
      return { ...prev, [projectId]: project };
    });
  };

  const clearForProject = (projectId: string) =>
    setStore((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });

  const changedFields = (projectId: string, tab: TabId) =>
    store[projectId]?.[tab] ?? new Set<string>();

  const changedTabs = (projectId: string) => {
    const tabs = new Set<TabId>();
    const proj = store[projectId];
    if (!proj) return tabs;
    (Object.keys(proj) as TabId[]).forEach((t) => {
      if ((proj[t]?.size ?? 0) > 0) tabs.add(t);
    });
    return tabs;
  };

  const isFieldChanged = (projectId: string, tab: TabId, field: string) =>
    Boolean(store[projectId]?.[tab]?.has(field));

  const value = useMemo<ProjectEditsValue>(
    () => ({
      markChanged,
      clearForProject,
      changedFields,
      changedTabs,
      isFieldChanged,
    }),
    [store],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProjectEdits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProjectEdits must be used inside ProjectEditsProvider");
  return v;
}

export type { TabId as ProjectEditTabId };
