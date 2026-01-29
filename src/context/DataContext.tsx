import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ConsumptionDataPoint,
  RatePeriod,
  BatteryConfig,
  SolarConfig,
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
  customBatteryConfigs: BatteryConfig[];

  // Solar configuration
  solarConfig: SolarConfig | null;
  customSolarConfigs: SolarConfig[];

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
  setBatteryConfig: (config: BatteryConfig | null) => void;
  clearBatteryConfig: () => void;
  addCustomBattery: (config: BatteryConfig) => void;
  updateCustomBattery: (id: string, config: Partial<BatteryConfig>) => void;
  deleteCustomBattery: (id: string) => void;

  // Actions for solar
  setSolarConfig: (config: SolarConfig | null) => void;
  clearSolarConfig: () => void;
  addCustomSolar: (config: SolarConfig) => void;
  updateCustomSolar: (id: string, config: Partial<SolarConfig>) => void;
  deleteCustomSolar: (id: string) => void;

  // Actions for UI state
  setSelectedTimeFrame: (timeFrame: TimeFrame) => void;
  setCustomDateRange: (range: DateRange | null) => void;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

// Default rate periods (UK Octopus Energy Intelligent Octopus Go)
const defaultRatePeriods: RatePeriod[] = [
  {
    id: 'cheap',
    name: 'Cheap Rate',
    startTime: '23:30',
    endTime: '05:30',
    ratePerKwh: 0.07,
    color: '#10b981', // green
  },
  {
    id: 'standard',
    name: 'Standard Rate',
    startTime: '05:30',
    endTime: '23:30',
    ratePerKwh: 0.3051,
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
      customBatteryConfigs: [],
      solarConfig: null,
      customSolarConfigs: [],
      selectedTimeFrame: 'day',
      customDateRange: null,
      darkMode: true,

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

      addCustomBattery: (config) =>
        set((state) => ({
          customBatteryConfigs: [...state.customBatteryConfigs, config],
        })),

      updateCustomBattery: (id, config) =>
        set((state) => ({
          customBatteryConfigs: state.customBatteryConfigs.map((c) =>
            c.id === id ? { ...c, ...config } : c
          ),
        })),

      deleteCustomBattery: (id) =>
        set((state) => ({
          customBatteryConfigs: state.customBatteryConfigs.filter((c) => c.id !== id),
        })),

      // Solar actions
      setSolarConfig: (config) =>
        set({ solarConfig: config }),

      clearSolarConfig: () =>
        set({ solarConfig: null }),

      addCustomSolar: (config) =>
        set((state) => ({
          customSolarConfigs: [...state.customSolarConfigs, config],
        })),

      updateCustomSolar: (id, config) =>
        set((state) => ({
          customSolarConfigs: state.customSolarConfigs.map((c) =>
            c.id === id ? { ...c, ...config } : c
          ),
        })),

      deleteCustomSolar: (id) =>
        set((state) => ({
          customSolarConfigs: state.customSolarConfigs.filter((c) => c.id !== id),
        })),

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
        customBatteryConfigs: state.customBatteryConfigs,
        solarConfig: state.solarConfig,
        customSolarConfigs: state.customSolarConfigs,
        darkMode: state.darkMode,
        // Don't persist consumption data (too large for localStorage)
      }),
      onRehydrateStorage: () => (state) => {
        // Apply dark mode immediately on rehydration to prevent flash
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
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
