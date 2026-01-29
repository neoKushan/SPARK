import type { RatePeriod, BatteryConfig, SolarConfig, ConsumptionDataPoint } from '@/types/consumption';

export interface ConsumptionSummary {
  avgDailyConsumption: number;  // Average kWh per day
  totalDays: number;             // Number of days in the dataset
  dateStart: string;             // ISO date string
  dateEnd: string;               // ISO date string
}

interface UrlState {
  ratePeriods?: RatePeriod[];
  batteryConfig?: BatteryConfig;
  solarConfig?: SolarConfig;
  consumptionSummary?: ConsumptionSummary;
}

/**
 * Encode configuration state to URL query parameters
 */
export function encodeStateToUrl(state: UrlState): string {
  const params = new URLSearchParams();

  // Encode rate periods
  if (state.ratePeriods) {
    state.ratePeriods.forEach((rate, i) => {
      params.set(`r${i}_name`, rate.name);
      params.set(`r${i}_start`, rate.startTime);
      params.set(`r${i}_end`, rate.endTime);
      params.set(`r${i}_rate`, rate.ratePerKwh.toString());
      if (rate.color) params.set(`r${i}_color`, rate.color);
    });
    params.set('rate_count', state.ratePeriods.length.toString());
  }

  // Encode battery config
  if (state.batteryConfig) {
    params.set('b_cap', state.batteryConfig.capacity.toString());
    params.set('b_charge', state.batteryConfig.chargeRate.toString());
    params.set('b_discharge', state.batteryConfig.dischargeRate.toString());
    params.set('b_eff', state.batteryConfig.roundtripEfficiency.toString());
    if (state.batteryConfig.cost) params.set('b_cost', state.batteryConfig.cost.toString());
    if (state.batteryConfig.name) params.set('b_name', state.batteryConfig.name);
  }

  // Encode solar config
  if (state.solarConfig) {
    params.set('s_cap', state.solarConfig.capacity.toString());
    params.set('s_orient', state.solarConfig.orientation);
    params.set('s_tilt', state.solarConfig.tilt.toString());
    params.set('s_peff', state.solarConfig.panelEfficiency.toString());
    params.set('s_seff', state.solarConfig.systemEfficiency.toString());
    if (state.solarConfig.cost) params.set('s_cost', state.solarConfig.cost.toString());
    if (state.solarConfig.exportRate) params.set('s_export', state.solarConfig.exportRate.toString());
    if (state.solarConfig.name) params.set('s_name', state.solarConfig.name);
  }

  // Encode consumption summary
  if (state.consumptionSummary) {
    params.set('c_avg', state.consumptionSummary.avgDailyConsumption.toString());
    params.set('c_days', state.consumptionSummary.totalDays.toString());
    params.set('c_start', state.consumptionSummary.dateStart);
    params.set('c_end', state.consumptionSummary.dateEnd);
  }

  return params.toString();
}

/**
 * Decode configuration state from URL query parameters
 */
export function decodeStateFromUrl(searchParams: URLSearchParams): UrlState {
  const state: UrlState = {};

  // Decode rate periods
  const rateCount = parseInt(searchParams.get('rate_count') || '0');
  if (rateCount > 0) {
    const ratePeriods: RatePeriod[] = [];
    for (let i = 0; i < rateCount; i++) {
      const name = searchParams.get(`r${i}_name`);
      const startTime = searchParams.get(`r${i}_start`);
      const endTime = searchParams.get(`r${i}_end`);
      const ratePerKwh = searchParams.get(`r${i}_rate`);

      if (name && startTime && endTime && ratePerKwh) {
        ratePeriods.push({
          id: `rate-${i}`,
          name,
          startTime,
          endTime,
          ratePerKwh: parseFloat(ratePerKwh),
          color: searchParams.get(`r${i}_color`) || undefined,
        });
      }
    }
    if (ratePeriods.length > 0) {
      state.ratePeriods = ratePeriods;
    }
  }

  // Decode battery config
  const bCap = searchParams.get('b_cap');
  if (bCap) {
    state.batteryConfig = {
      capacity: parseFloat(bCap),
      chargeRate: parseFloat(searchParams.get('b_charge') || '5'),
      dischargeRate: parseFloat(searchParams.get('b_discharge') || '5'),
      roundtripEfficiency: parseFloat(searchParams.get('b_eff') || '90'),
      cost: searchParams.get('b_cost') ? parseFloat(searchParams.get('b_cost')!) : undefined,
      name: searchParams.get('b_name') || undefined,
      minimumSoc: 10,
      maximumSoc: 100,
    };
  }

  // Decode solar config
  const sCap = searchParams.get('s_cap');
  if (sCap) {
    state.solarConfig = {
      capacity: parseFloat(sCap),
      orientation: (searchParams.get('s_orient') || 'south') as any,
      tilt: parseFloat(searchParams.get('s_tilt') || '35'),
      panelEfficiency: parseFloat(searchParams.get('s_peff') || '20'),
      systemEfficiency: parseFloat(searchParams.get('s_seff') || '85'),
      cost: searchParams.get('s_cost') ? parseFloat(searchParams.get('s_cost')!) : undefined,
      exportRate: searchParams.get('s_export') ? parseFloat(searchParams.get('s_export')!) : 0.15,
      name: searchParams.get('s_name') || undefined,
    };
  }

  // Decode consumption summary
  const cAvg = searchParams.get('c_avg');
  if (cAvg) {
    state.consumptionSummary = {
      avgDailyConsumption: parseFloat(cAvg),
      totalDays: parseInt(searchParams.get('c_days') || '30'),
      dateStart: searchParams.get('c_start') || new Date().toISOString(),
      dateEnd: searchParams.get('c_end') || new Date().toISOString(),
    };
  }

  return state;
}

/**
 * Generate synthetic consumption data from summary statistics
 * Creates evenly distributed 30-minute intervals with realistic daily patterns
 */
export function generateSyntheticConsumption(summary: ConsumptionSummary): ConsumptionDataPoint[] {
  const data: ConsumptionDataPoint[] = [];
  const startDate = new Date(summary.dateStart);
  const avgPer30Min = summary.avgDailyConsumption / 48; // 48 intervals per day

  // Seasonal multipliers (winter higher, summer lower)
  const seasonalMultipliers = [
    1.3,  // January
    1.25, // February
    1.15, // March
    1.0,  // April
    0.85, // May
    0.75, // June
    0.7,  // July
    0.75, // August
    0.85, // September
    1.0,  // October
    1.15, // November
    1.25, // December
  ];

  // Generate data for each day
  for (let day = 0; day < summary.totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    const month = currentDate.getMonth();
    const seasonalMultiplier = seasonalMultipliers[month];
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const weekendMultiplier = isWeekend ? 1.1 : 1.0; // Slightly higher on weekends

    // Generate 48 intervals per day (30 minutes each)
    for (let interval = 0; interval < 48; interval++) {
      const start = new Date(currentDate);
      start.setHours(Math.floor(interval / 2));
      start.setMinutes((interval % 2) * 30);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);

      const hour = start.getHours();

      // Time of day consumption pattern
      let timeMultiplier = 1.0;
      if (hour >= 0 && hour < 6) {
        timeMultiplier = 0.4; // Very low at night
      } else if (hour >= 6 && hour < 9) {
        timeMultiplier = 1.6; // Morning peak
      } else if (hour >= 9 && hour < 12) {
        timeMultiplier = 0.9; // Mid-morning
      } else if (hour >= 12 && hour < 14) {
        timeMultiplier = 1.1; // Lunch
      } else if (hour >= 14 && hour < 17) {
        timeMultiplier = 0.8; // Afternoon
      } else if (hour >= 17 && hour < 22) {
        timeMultiplier = 1.8; // Evening peak
      } else {
        timeMultiplier = 0.7; // Late evening
      }

      // Add some random variation (±15%)
      const randomVariation = 0.85 + Math.random() * 0.3;

      const consumption = avgPer30Min *
                         seasonalMultiplier *
                         weekendMultiplier *
                         timeMultiplier *
                         randomVariation;

      data.push({
        consumption: Math.max(0.1, consumption), // Ensure minimum consumption
        start,
        end,
      });
    }
  }

  return data;
}

/**
 * Apply URL state to store
 */
export function applyUrlState(
  urlState: UrlState,
  store: {
    setRatePeriods?: (periods: RatePeriod[]) => void;
    setBatteryConfig?: (config: BatteryConfig) => void;
    setSolarConfig?: (config: SolarConfig) => void;
    setConsumptionData?: (data: ConsumptionDataPoint[], fileName: string) => void;
  }
) {
  if (urlState.ratePeriods && store.setRatePeriods) {
    store.setRatePeriods(urlState.ratePeriods);
  }
  if (urlState.batteryConfig && store.setBatteryConfig) {
    store.setBatteryConfig(urlState.batteryConfig);
  }
  if (urlState.solarConfig && store.setSolarConfig) {
    store.setSolarConfig(urlState.solarConfig);
  }
  if (urlState.consumptionSummary && store.setConsumptionData) {
    const syntheticData = generateSyntheticConsumption(urlState.consumptionSummary);
    store.setConsumptionData(
      syntheticData,
      'Shared Configuration (Synthetic Data)'
    );
  }
}
