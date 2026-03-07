import { createContext, useContext, useCallback, useState, useMemo, useEffect } from "react";

const STORAGE_FARM_NAME = "herdsense_farm_name";
const STORAGE_HERD_SIZE = "herdsense_herd_size";
const DEFAULT_FARM_NAME = "Meadowbrook Farm";
const DEFAULT_HERD_SIZE = 247;

function readFarmName(): string {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_FARM_NAME;
  try {
    const s = window.localStorage.getItem(STORAGE_FARM_NAME);
    return (s && s.trim()) ? s.trim() : DEFAULT_FARM_NAME;
  } catch {
    return DEFAULT_FARM_NAME;
  }
}

function readHerdSize(): number {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_HERD_SIZE;
  try {
    const n = window.localStorage.getItem(STORAGE_HERD_SIZE);
    const v = n ? parseInt(n, 10) : DEFAULT_HERD_SIZE;
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_HERD_SIZE;
  } catch {
    return DEFAULT_HERD_SIZE;
  }
}

interface FarmSettingsContextValue {
  farmName: string;
  herdSize: number;
  setFarmName: (name: string) => void;
  setHerdSize: (size: number) => void;
}

const FarmSettingsContext = createContext<FarmSettingsContextValue | null>(null);

export function FarmSettingsProvider({ children }: { children: React.ReactNode }) {
  const [farmName, setFarmNameState] = useState(() => readFarmName());
  const [herdSize, setHerdSizeState] = useState(() => readHerdSize());

  // Hydrate from localStorage after mount (handles refresh or late storage)
  useEffect(() => {
    setFarmNameState(readFarmName());
    setHerdSizeState(readHerdSize());
  }, []);

  // Sync from localStorage when another tab updates (storage event only fires for other tabs)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      setFarmNameState(readFarmName());
      setHerdSizeState(readHerdSize());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setFarmName = useCallback((name: string) => {
    const value = (name && name.trim()) ? name.trim() : DEFAULT_FARM_NAME;
    setFarmNameState(value);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_FARM_NAME, value);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const setHerdSize = useCallback((size: number) => {
    const value = Number.isFinite(size) && size > 0 ? size : DEFAULT_HERD_SIZE;
    setHerdSizeState(value);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_HERD_SIZE, String(value));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo(
    () => ({ farmName, herdSize, setFarmName, setHerdSize }),
    [farmName, herdSize, setFarmName, setHerdSize],
  );

  return <FarmSettingsContext.Provider value={value}>{children}</FarmSettingsContext.Provider>;
}

export function useFarmSettings(): FarmSettingsContextValue {
  const ctx = useContext(FarmSettingsContext);
  if (!ctx) {
    return {
      farmName: readFarmName(),
      herdSize: readHerdSize(),
      setFarmName: () => {},
      setHerdSize: () => {},
    };
  }
  return ctx;
}
