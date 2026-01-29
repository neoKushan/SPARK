import { differenceInHours, startOfDay } from 'date-fns';
import type {
  ConsumptionDataPoint,
  BatteryConfig,
  RatePeriod,
  BatteryAnalysis,
  BatteryState,
} from '@/types/consumption';
import { matchRatePeriod } from './pricingCalculator';

/**
 * Simulate battery usage and calculate savings
 */
export function simulateBattery(
  data: ConsumptionDataPoint[],
  batteryConfig: BatteryConfig,
  ratePeriods: RatePeriod[]
): BatteryAnalysis {
  const states: BatteryState[] = [];
  const savingsByRate = new Map<string, number>();
  let totalSavings = 0;

  // Initialize savings map
  ratePeriods.forEach((period) => {
    savingsByRate.set(period.id, 0);
  });

  // Get min and max SOC limits
  const minSoc = (batteryConfig.minimumSoc || 10) / 100 * batteryConfig.capacity;
  const maxSoc = (batteryConfig.maximumSoc || 100) / 100 * batteryConfig.capacity;

  // Start with empty battery
  let stateOfCharge = 0;

  // Find cheap and expensive rates
  const rateValues = ratePeriods.map((p) => p.ratePerKwh);
  const cheapRate = Math.min(...rateValues);
  const cheapPeriod = ratePeriods.find((p) => p.ratePerKwh === cheapRate)!;

  // Simulate each 30-minute interval
  for (const point of data) {
    const currentRate = matchRatePeriod(point.start, ratePeriods);
    const intervalHours = differenceInHours(point.end, point.start, { roundingMethod: 'round' }) || 0.5;

    let action: 'charging' | 'discharging' | 'idle' = 'idle';
    let powerFlow = 0;
    let periodSavings = 0;

    // Strategy: Charge during cheap rate, discharge during expensive rate
    const isCheapPeriod = currentRate.id === cheapPeriod.id;
    const isExpensivePeriod = currentRate.ratePerKwh > cheapRate;

    if (isCheapPeriod && stateOfCharge < maxSoc) {
      // Charge battery during cheap rate
      const maxChargeAmount = Math.min(
        maxSoc - stateOfCharge,
        batteryConfig.chargeRate * intervalHours,
        point.consumption // Can only charge with available grid power
      );

      if (maxChargeAmount > 0) {
        const actualChargeAmount = maxChargeAmount * (batteryConfig.roundtripEfficiency / 100);
        stateOfCharge += actualChargeAmount;
        action = 'charging';
        powerFlow = maxChargeAmount / intervalHours;

        // Cost of charging
        periodSavings -= maxChargeAmount * currentRate.ratePerKwh;
      }
    } else if (isExpensivePeriod && stateOfCharge > minSoc) {
      // Discharge battery during expensive rate
      const maxDischargeAmount = Math.min(
        stateOfCharge - minSoc,
        batteryConfig.dischargeRate * intervalHours,
        point.consumption // Can't discharge more than consumption
      );

      if (maxDischargeAmount > 0) {
        stateOfCharge -= maxDischargeAmount;
        action = 'discharging';
        powerFlow = -maxDischargeAmount / intervalHours;

        // Savings from using battery instead of grid
        periodSavings += maxDischargeAmount * (currentRate.ratePerKwh - cheapRate);
      }
    }

    // Ensure SOC stays within limits
    stateOfCharge = Math.max(minSoc, Math.min(maxSoc, stateOfCharge));

    // Record state
    states.push({
      timestamp: point.start,
      stateOfCharge,
      socPercentage: (stateOfCharge / batteryConfig.capacity) * 100,
      action,
      powerFlow,
    });

    // Accumulate savings
    totalSavings += periodSavings;
    const currentRateSavings = savingsByRate.get(currentRate.id) || 0;
    savingsByRate.set(currentRate.id, currentRateSavings + periodSavings);
  }

  // Calculate daily average
  const dataIntervals = data.length;
  const intervalsPerDay = 48;
  const days = dataIntervals / intervalsPerDay;
  const dailyAverageSavings = totalSavings / days;

  // Calculate annual estimate
  const annualEstimate = dailyAverageSavings * 365;

  // Calculate payback period using actual cost or default to £500 per kWh
  const batteryCost = batteryConfig.cost || (batteryConfig.capacity * 500);
  const paybackPeriod = annualEstimate > 0 ? batteryCost / annualEstimate : Infinity;

  // Calculate self-consumption rate
  const totalDischargeEnergy = states
    .filter((s) => s.action === 'discharging')
    .reduce((sum, s) => sum + Math.abs(s.powerFlow) * 0.5, 0);
  const totalConsumption = data.reduce((sum, p) => sum + p.consumption, 0);
  const selfConsumptionRate = (totalDischargeEnergy / totalConsumption) * 100;

  // Calculate peak shaving benefit
  const consumptions = data.map((p) => p.consumption);
  const peakWithoutBattery = Math.max(...consumptions);
  // Estimate peak with battery (simplified)
  const peakShavingBenefit = peakWithoutBattery * 0.2; // Rough estimate of 20% peak reduction

  // Calculate winter coverage
  const winterCoverage = calculateWinterCoverage(data, states);

  return {
    batteryConfig,
    totalSavings,
    dailyAverageSavings,
    annualEstimate,
    paybackPeriod,
    selfConsumptionRate,
    peakShavingBenefit,
    states,
    savingsByRate,
    winterCoverage,
  };
}

/**
 * Calculate winter coverage statistics
 */
function calculateWinterCoverage(
  data: ConsumptionDataPoint[],
  states: BatteryState[]
): {
  averageDailyCoverage: number;
  minimumCoverage: number;
  worstDay: Date;
} {
  if (data.length === 0) {
    return {
      averageDailyCoverage: 0,
      minimumCoverage: 0,
      worstDay: new Date(),
    };
  }

  // Group by day
  const dayGroups = new Map<string, { data: ConsumptionDataPoint[]; states: BatteryState[] }>();

  data.forEach((point, index) => {
    const dayKey = startOfDay(point.start).toISOString();
    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, { data: [], states: [] });
    }
    dayGroups.get(dayKey)!.data.push(point);
    dayGroups.get(dayKey)!.states.push(states[index]);
  });

  let totalCoverage = 0;
  let minCoverage = 100;
  let worstDay = data[0].start;

  dayGroups.forEach((group, dayKey) => {
    const dayConsumption = group.data.reduce((sum, p) => sum + p.consumption, 0);
    const batteryProvided = group.states
      .filter((s) => s.action === 'discharging')
      .reduce((sum, s) => sum + Math.abs(s.powerFlow) * 0.5, 0);

    const coverage = dayConsumption > 0 ? (batteryProvided / dayConsumption) * 100 : 0;
    totalCoverage += coverage;

    if (coverage < minCoverage) {
      minCoverage = coverage;
      worstDay = new Date(dayKey);
    }
  });

  return {
    averageDailyCoverage: totalCoverage / dayGroups.size,
    minimumCoverage: minCoverage,
    worstDay,
  };
}

/**
 * Compare different battery configurations
 */
export function compareBatteryConfigs(
  data: ConsumptionDataPoint[],
  configs: BatteryConfig[],
  ratePeriods: RatePeriod[]
): BatteryAnalysis[] {
  return configs.map((config) => simulateBattery(data, config, ratePeriods));
}

/**
 * Calculate optimal battery size based on consumption patterns
 */
export function recommendBatterySize(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): { recommendedCapacity: number; reasoning: string } {
  if (data.length === 0) {
    return {
      recommendedCapacity: 10,
      reasoning: 'No data available for analysis',
    };
  }

  // Calculate average daily consumption
  const dataIntervals = data.length;
  const intervalsPerDay = 48;
  const days = dataIntervals / intervalsPerDay;

  // Find cheap rate period
  const cheapRate = Math.min(...ratePeriods.map((p) => p.ratePerKwh));
  const cheapPeriod = ratePeriods.find((p) => p.ratePerKwh === cheapRate)!;

  // Calculate consumption during expensive periods
  const expensivePeriodConsumption = data
    .filter((point) => {
      const rate = matchRatePeriod(point.start, ratePeriods);
      return rate.id !== cheapPeriod.id;
    })
    .reduce((sum, p) => sum + p.consumption, 0);

  const avgDailyExpensiveConsumption = expensivePeriodConsumption / days;

  // Recommend capacity to cover 80% of expensive period consumption
  const recommendedCapacity = Math.ceil(avgDailyExpensiveConsumption * 0.8);

  // Round to common battery sizes
  const commonSizes = [5, 10, 13.5, 20];
  const closestSize = commonSizes.reduce((prev, curr) =>
    Math.abs(curr - recommendedCapacity) < Math.abs(prev - recommendedCapacity) ? curr : prev
  );

  return {
    recommendedCapacity: closestSize,
    reasoning: `Based on your consumption patterns, you use approximately ${avgDailyExpensiveConsumption.toFixed(1)} kWh per day during expensive rate periods. A ${closestSize} kWh battery can cover ${((closestSize / avgDailyExpensiveConsumption) * 100).toFixed(0)}% of this consumption, maximizing savings while keeping costs reasonable.`,
  };
}

/**
 * Get common battery presets
 */
export function getBatteryPresets() {
  return [
    {
      name: 'Small (5 kWh)',
      capacity: 5,
      chargeRate: 3,
      dischargeRate: 3,
      roundtripEfficiency: 90,
      cost: 3500,
      description: 'Suitable for small homes or apartments',
    },
    {
      name: 'Medium (10 kWh)',
      capacity: 10,
      chargeRate: 5,
      dischargeRate: 5,
      roundtripEfficiency: 90,
      cost: 6000,
      description: 'Good for average homes',
    },
    {
      name: 'Large (13.5 kWh - Powerwall 2)',
      capacity: 13.5,
      chargeRate: 5,
      dischargeRate: 5,
      roundtripEfficiency: 90,
      cost: 8000,
      description: 'Tesla Powerwall 2 equivalent, suitable for larger homes',
    },
    {
      name: 'Extra Large (20 kWh)',
      capacity: 20,
      chargeRate: 7,
      dischargeRate: 7,
      roundtripEfficiency: 90,
      cost: 12000,
      description: 'For large homes with high consumption',
    },
  ];
}
