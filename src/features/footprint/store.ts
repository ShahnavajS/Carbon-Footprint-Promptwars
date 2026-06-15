import { create } from "zustand";
import type { CarbonLog } from "@/types";

interface FootprintState {
  logs: CarbonLog[];
  totalCarbonKg: number;
  isLoading: boolean;
  error: string | null;
  setLogs: (logs: CarbonLog[]) => void;
  addLog: (log: CarbonLog) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFootprintStore = create<FootprintState>((set) => ({
  logs: [],
  totalCarbonKg: 0,
  isLoading: false,
  error: null,
  setLogs: (logs) =>
    set({
      logs,
      totalCarbonKg: logs.reduce((sum, log) => sum + log.carbonFootprintKg, 0),
    }),
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs],
      totalCarbonKg: state.totalCarbonKg + log.carbonFootprintKg,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
