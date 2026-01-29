// Core data types for energy consumption tracking

/**
 * Represents a single consumption data point from the CSV
 */
export interface ConsumptionDataPoint {
  consumption: number;  // kWh consumed during the period
  start: Date;          // Start timestamp of the measurement period
  end: Date;            // End timestamp of the measurement period
}

/**
 * Raw CSV row before parsing
 */
export interface RawCsvRow {
  'Consumption (kwh)': string;
  Start: string;
  End: string;
}

/**
 * Result of CSV parsing operation
 */
export interface ParseResult {
  success: boolean;
  data?: ConsumptionDataPoint[];
  error?: string;
  rowCount?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Time-based rate period (e.g., cheap rate during night hours)
 */
export interface RatePeriod {
  id: string;
  name: string;          // e.g., "Cheap", "Standard", "Peak"
  startTime: string;     // "HH:mm" format, e.g., "23:30"
  endTime: string;       // "HH:mm" format, e.g., "05:00"
  ratePerKwh: number;    // Price per kWh, e.g., 0.075 for £0.075/kWh
  color?: string;        // Color for visualization
}

/**
 * Cost calculation for a consumption period
 */
export interface CostDataPoint {
  consumption: number;
  cost: number;
  ratePeriod: RatePeriod;
  timestamp: Date;
}

/**
 * Aggregated consumption data for different time periods
 */
export interface AggregatedData {
  period: string;                    // Date string (format depends on aggregation type)
  totalConsumption: number;          // Total kWh
  totalCost?: number;                // Total cost (if rates are configured)
  averageConsumption: number;        // Average kWh per interval
  peakConsumption: number;           // Maximum kWh in any single interval
  peakTime: Date;                    // When peak occurred
  dataPointCount: number;            // Number of intervals in this period
  costByRate?: Map<string, number>;  // Cost breakdown by rate period
}

/**
 * Time frame for aggregation and visualization
 */
export type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'all';

/**
 * Date range for filtering data
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Battery configuration for simulation
 */
export interface BatteryConfig {
  capacity: number;          // kWh (e.g., 5, 10, 13.5)
  chargeRate: number;        // kW max charging power
  dischargeRate: number;     // kW max discharging power
  roundtripEfficiency: number; // Percentage (e.g., 90 for 90%)
  minimumSoc?: number;       // Minimum state of charge % (optional, default 10%)
  maximumSoc?: number;       // Maximum state of charge % (optional, default 100%)
}

/**
 * Common battery sizes for quick selection
 */
export interface BatteryPreset {
  name: string;
  capacity: number;
  chargeRate: number;
  dischargeRate: number;
  roundtripEfficiency: number;
  description: string;
}

/**
 * Battery simulation state at a point in time
 */
export interface BatteryState {
  timestamp: Date;
  stateOfCharge: number;     // kWh currently stored
  socPercentage: number;     // Percentage of capacity
  action: 'charging' | 'discharging' | 'idle';
  powerFlow: number;         // kW (positive = charging, negative = discharging)
}

/**
 * Battery simulation results
 */
export interface BatteryAnalysis {
  batteryConfig: BatteryConfig;
  totalSavings: number;          // Total cost savings
  dailyAverageSavings: number;   // Average savings per day
  annualEstimate: number;        // Projected annual savings
  paybackPeriod: number;         // Years to break even (if cost provided)
  selfConsumptionRate: number;   // Percentage of consumption from battery
  peakShavingBenefit: number;    // Reduction in peak demand
  states: BatteryState[];        // Detailed state timeline
  savingsByRate: Map<string, number>; // Savings broken down by rate period
  winterCoverage: {
    averageDailyCoverage: number;    // % of daily consumption covered
    minimumCoverage: number;          // Worst case day coverage %
    worstDay: Date;                   // Date of worst coverage
  };
}

/**
 * Cost comparison with and without battery
 */
export interface CostComparison {
  withoutBattery: {
    totalCost: number;
    costByRate: Map<string, number>;
  };
  withBattery: {
    totalCost: number;
    costByRate: Map<string, number>;
    batterySavings: number;
  };
  savingsPercentage: number;
}

/**
 * Statistics for a dataset
 */
export interface ConsumptionStats {
  totalConsumption: number;
  averageConsumption: number;
  minConsumption: number;
  maxConsumption: number;
  medianConsumption: number;
  standardDeviation: number;
  dataPoints: number;
  dateRange: DateRange;
}

/**
 * Chart data point for visualization
 */
export interface ChartDataPoint {
  timestamp: number;     // Unix timestamp for x-axis
  consumption: number;   // kWh for y-axis
  cost?: number;         // Optional cost
  label?: string;        // Optional label for tooltip
  ratePeriod?: string;   // Which rate period applies
}

/**
 * Filter options for data display
 */
export interface DataFilters {
  dateRange?: DateRange;
  timeFrame: TimeFrame;
  selectedRates?: string[];  // Filter by specific rate periods
  minConsumption?: number;
  maxConsumption?: number;
}

/**
 * Export options for data
 */
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeCharts: boolean;
  includeCosts: boolean;
  includeBatteryAnalysis: boolean;
  dateRange?: DateRange;
}
