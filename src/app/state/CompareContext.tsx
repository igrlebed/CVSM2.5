import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

interface CompareContextValue {
  basket: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  pruneTo: (allowed: string[]) => string[];
}

const Ctx = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [basket, setBasket] = useState<string[]>([]);

  const add = useCallback((id: string) => {
    setBasket((b) => (b.includes(id) ? b : [...b, id]));
  }, []);
  const remove = useCallback((id: string) => {
    setBasket((b) => b.filter((x) => x !== id));
  }, []);
  const toggle = useCallback((id: string) => {
    setBasket((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  }, []);
  const clear = useCallback(() => setBasket([]), []);
  const has = useCallback((id: string) => basket.includes(id), [basket]);
  const pruneTo = useCallback((allowed: string[]) => {
    let removed: string[] = [];
    setBasket((b) => {
      const allow = new Set(allowed);
      removed = b.filter((x) => !allow.has(x));
      return removed.length === 0 ? b : b.filter((x) => allow.has(x));
    });
    return removed;
  }, []);

  const value = useMemo(
    () => ({ basket, add, remove, toggle, clear, has, pruneTo }),
    [basket, add, remove, toggle, clear, has, pruneTo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompare must be used inside CompareProvider");
  return v;
}
