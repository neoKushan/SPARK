import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConsumptionDataPoint,
  RatePeriod,
  BatteryConfig,
  DateRange,
  TimeFrame,
} from '@/types/consumption';

interface DataState {
  // Consumption data
  consumptionData: ConsumptionDataPoint[];
  dataLoaded: boolean;
  fileName: string | null;
  dateRange: DateRange | null;

  // Rate periods
  ratePeriods: RatePeriod[];

  // Battery configuration
  batteryConfig: BatteryConfig | null;

  // UI State
  selectedTimeFrame: TimeFrame;
  customDateRange: DateRange | null;
  darkMode: boolean;

  // Actions for consumption data
  setConsumptionData: (data: ConsumptionDataPoint[], fileName: string) => void;
  clearConsumptionData: () => void;

  // Actions for rate periods
  addRatePeriod: (period: RatePeriod) => void;
  updateRatePeriod: (id: string, period: Partial<RatePeriod>) => void;
  deleteRatePeriod: (id: string) => void;
  setRatePeriods: (periods: RatePeriod[]) => void;

  // Actions for battery
  setBatteryConfig: (config: BatteryConfig) => void;
  clearBatteryConfig: () => void;

  // Actions for UI state
  setSelectedTimeFrame: (timeFrame: TimeFrame) => void;
  setCustomDateRange: (range: DateRange | null) => void;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

// Default rate periods (UK Octopus Energy Agile style)
const defaultRatePeriods: RatePeriod[] = [
  {
    id: 'cheap',
    name: 'Cheap Rate',
    startTime: '23:30',
    endTime: '05:00',
    ratePerKwh: 0.075,
    color: '#10b981', // green
  },
  {
    id: 'standard',
    name: 'Standard Rate',
    startTime: '05:00',
    endTime: '23:30',
    ratePerKwh: 0.245,
    color: '#3b82f6', // blue
  },
];

// Default battery configuration (Tesla Powerwall 2 as reference)
const defaultBatteryConfig: BatteryConfig = {
  capacity: 13.5,
  chargeRate: 5,
  dischargeRate: 5,
  roundtripEfficiency: 90,
  minimumSoc: 10,
  maximumSoc: 100,
};

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      // Initial state
      consumptionData: [],
      dataLoaded: false,
      fileName: null,
      dateRange: null,
      ratePeriods: defaultRatePeriods,
      batteryConfig: defaultBatteryConfig,
      selectedTimeFrame: 'day',
      customDateRange: null,
      darkMode: false,

      // Consumption data actions
      setConsumptionData: (data, fileName) =>
        set({
          consumptionData: data,
          dataLoaded: true,
          fileName,
          dateRange: data.length > 0 ? {
            start: data[0].start,
            end: data[data.length - 1].end,
          } : null,
        }),

      clearConsumptionData: () =>
        set({
          consumptionData: [],
          dataLoaded: false,
          fileName: null,
          dateRange: null,
          customDateRange: null,
        }),

      // Rate period actions
      addRatePeriod: (period) =>
        set((state) => ({
          ratePeriods: [...state.ratePeriods, period],
        })),

      updateRatePeriod: (id, updates) =>
        set((state) => ({
          ratePeriods: state.ratePeriods.map((period) =>
            period.id === id ? { ...period, ...updates } : period
          ),
        })),

      deleteRatePeriod: (id) =>
        set((state) => ({
          ratePeriods: state.ratePeriods.filter((period) => period.id !== id),
        })),

      setRatePeriods: (periods) =>
        set({ ratePeriods: periods }),

      // Battery actions
      setBatteryConfig: (config) =>
        set({ batteryConfig: config }),

      clearBatteryConfig: () =>
        set({ batteryConfig: null }),

      // UI state actions
      setSelectedTimeFrame: (timeFrame) =>
        set({ selectedTimeFrame: timeFrame }),

      setCustomDateRange: (range) =>
        set({ customDateRange: range }),

      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.darkMode;
          // Update document class for Tailwind dark mode
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newMode };
        }),

      setDarkMode: (enabled) =>
        set(() => {
          // Update document class for Tailwind dark mode
          if (enabled) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: enabled };
        }),
    }),
    {
      name: 'octoview-storage',
      partialize: (state) => ({
        // Only persist these fields
        ratePeriods: state.ratePeriods,
        batteryConfig: state.batteryConfig,
        darkMode: state.darkMode,
        // Don't persist consumption data (too large for localStorage)
      }),
    }
  )
);

// Hook to initialize dark mode on mount
export function useDarkModeInit() {
  const { darkMode, setDarkMode } = useDataStore();

  // Initialize dark mode from stored preference or system preference
  if (typeof window !== 'undefined') {
    const stored = darkMode;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(stored !== null ? stored : prefersDark);
  }
}
