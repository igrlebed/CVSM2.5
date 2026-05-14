import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ExportContextSnapshot } from "../types";

interface ExportContextValue {
  snapshot: ExportContextSnapshot | null;
  setSnapshot: (s: ExportContextSnapshot | null) => void;
  /** Quick export modal control. */
  quickOpen: boolean;
  quickSnapshot: ExportContextSnapshot | null;
  openQuickExport: (s: ExportContextSnapshot) => void;
  closeQuickExport: () => void;
}

const Ctx = createContext<ExportContextValue | null>(null);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ExportContextSnapshot | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSnapshot, setQuickSnapshot] =
    useState<ExportContextSnapshot | null>(null);

  const openQuickExport = useCallback((s: ExportContextSnapshot) => {
    setQuickSnapshot(s);
    setSnapshot(s);
    setQuickOpen(true);
  }, []);
  const closeQuickExport = useCallback(() => setQuickOpen(false), []);

  const value = useMemo(
    () => ({
      snapshot,
      setSnapshot,
      quickOpen,
      quickSnapshot,
      openQuickExport,
      closeQuickExport,
    }),
    [snapshot, quickOpen, quickSnapshot, openQuickExport, closeQuickExport],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExport() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExport must be used inside ExportProvider");
  return v;
}
