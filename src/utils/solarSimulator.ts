import { differenceInHours, getHours, getMonth } from 'date-fns';
import type {
  ConsumptionDataPoint,
  SolarConfig,
  SolarAnalysis,
  SolarGeneration,
  RatePeriod,
  BatteryConfig,
  CombinedAnalysis,
  BatteryState,
} from '@/types/consumption';
import { matchRatePeriod } from './pricingCalculator';

/**
 * Estimate solar generation for a given timestamp
 * Based on UK solar irradiance patterns
 */
function estimateGeneration(
  timestamp: Date,
  config: SolarConfig,
  scalingFactor: number = 1.0
): number {
  const hour = getHours(timestamp);
  const month = getMonth(timestamp); // 0-11

  // Daylight hours in UK vary by season
  const isDaytime = hour >= 6 && hour <= 20;
  if (!isDaytime) return 0;

  // Peak sun hours per month in UK (approximate)
  const peakSunHours = [
    1.0, 1.5, 2.5, 4.0, 5.0, 5.5, // Jan-Jun
    5.0, 4.5, 3.5, 2.5, 1.5, 1.0, // Jul-Dec
  ];

  const monthPeakHours = peakSunHours[month];

  // Solar elevation curve (simple sine wave approximation)
  // Peak at solar noon (12-1pm)
  const hourFromNoon = Math.abs(13 - hour);
  const elevationFactor = Math.max(0, 1 - (hourFromNoon / 7) ** 2);

  // Orientation factor
  const orientationFactors: Record<string, number> = {
    'south': 1.0,
    'south-east': 0.9,
    'south-west': 0.9,
    'east': 0.7,
    'west': 0.7,
    'north': 0.5,
  };
  const orientationFactor = orientationFactors[config.orientation] || 1.0;

  // Tilt factor (optimal for UK is ~35 degrees)
  const optimalTilt = 35;
  const tiltFactor = 1 - Math.abs(config.tilt - optimalTilt) / 100;

  // Calculate generation (kW)
  const generation =
    config.capacity *
    (monthPeakHours / 5.5) * // Normalize to peak month
    elevationFactor *
    orientationFactor *
    tiltFactor *
    (config.panelEfficiency / 20) * // Normalize to 20% efficient panels
    (config.systemEfficiency / 100) *
    scalingFactor; // Apply scaling factor for predicted annual output

  return Math.max(0, generation);
}

/**
 * Calculate scaling factor for predicted annual output
 * Returns 1.0 if no predicted output is provided
 */
function calculateScalingFactor(
  data: ConsumptionDataPoint[],
  config: SolarConfig
): number {
  if (!config.predictedAnnualOutput) {
    return 1.0;
  }

  // Quick calculation of what the total generation would be without override
  let estimatedTotal = 0;
  for (const point of data) {
    const intervalHours = differenceInHours(point.end, point.start, { roundingMethod: 'round' }) || 0.5;
    const generationKw = estimateGeneration(point.start, config, 1.0);
    estimatedTotal += generationKw * intervalHours;
  }

  // Scale to match predicted annual output
  if (estimatedTotal === 0) return 1.0;

  const datasetDays = data.length / 48;
  const annualizedEstimate = (estimatedTotal / datasetDays) * 365;

  return config.predictedAnnualOutput / annualizedEstimate;
}

/**
 * Simulate solar generation without battery
 */
export function simulateSolar(
  data: ConsumptionDataPoint[],
  solarConfig: SolarConfig,
  ratePeriods: RatePeriod[],
  exportRate: number = 0.15
): SolarAnalysis {
  const generations: SolarGeneration[] = [];
  let totalGeneration = 0;
  let totalExported = 0;
  let totalSelfConsumed = 0;
  let exportEarnings = 0;
  let importSavings = 0;

  const scalingFactor = calculateScalingFactor(data, solarConfig);

  for (const point of data) {
    const intervalHours = differenceInHours(point.end, point.start, { roundingMethod: 'round' }) || 0.5;
    const currentRate = matchRatePeriod(point.start, ratePeriods);

    // Estimate generation for this interval (kW average)
    const generationKw = estimateGeneration(point.start, solarConfig, scalingFactor);
    const generationKwh = generationKw * intervalHours;

    // Determine how much is consumed vs exported
    const consumptionKwh = point.consumption;
    const consumed = Math.min(generationKwh, consumptionKwh);
    const exported = Math.max(0, generationKwh - consumptionKwh);

    totalGeneration += generationKwh;
    totalExported += exported;
    totalSelfConsumed += consumed;

    // Calculate savings
    exportEarnings += exported * exportRate;
    importSavings += consumed * currentRate.ratePerKwh;

    generations.push({
      timestamp: point.start,
      generation: generationKw,
      consumed: consumed / intervalHours,
      exported: exported / intervalHours,
      batteryCharged: 0,
    });
  }

  const totalSavings = exportEarnings + importSavings;
  const days = data.length / 48;
  const dailyAverageSavings = totalSavings / days;
  const annualEstimate = dailyAverageSavings * 365;
  const systemCost = solarConfig.cost || solarConfig.capacity * 1200; // £1200/kW typical
  const paybackPeriod = annualEstimate > 0 ? systemCost / annualEstimate : Infinity;
  const selfConsumptionRate = totalGeneration > 0 ? (totalSelfConsumed / totalGeneration) * 100 : 0;

  return {
    solarConfig,
    totalGeneration,
    totalExported,
    totalSelfConsumed,
    exportEarnings,
    importSavings,
    totalSavings,
    dailyAverageSavings,
    annualEstimate,
    paybackPeriod,
    selfConsumptionRate,
    generations,
  };
}

/**
 * Simulate combined solar + battery system
 */
export function simulateSolarWithBattery(
  data: ConsumptionDataPoint[],
  solarConfig: SolarConfig,
  batteryConfig: BatteryConfig,
  ratePeriods: RatePeriod[],
  exportRate: number = 0.15
): CombinedAnalysis {
  const generations: SolarGeneration[] = [];
  const batteryStates: BatteryState[] = [];

  let totalGeneration = 0;
  let totalExported = 0;
  let totalSelfConsumed = 0;
  let totalBatteryCharged = 0;
  let totalBatteryDischarged = 0;
  let exportEarnings = 0;
  let importSavings = 0;
  const minSoc = (batteryConfig.minimumSoc || 10) / 100 * batteryConfig.capacity;
  const maxSoc = (batteryConfig.maximumSoc || 100) / 100 * batteryConfig.capacity;
  let stateOfCharge = 0;

  // Find cheap rate period
  const cheapRate = Math.min(...ratePeriods.map(p => p.ratePerKwh));
  const cheapPeriod = ratePeriods.find(p => p.ratePerKwh === cheapRate)!;

  const scalingFactor = calculateScalingFactor(data, solarConfig);

  for (const point of data) {
    const intervalHours = differenceInHours(point.end, point.start, { roundingMethod: 'round' }) || 0.5;
    const currentRate = matchRatePeriod(point.start, ratePeriods);
    const isCheapPeriod = currentRate.id === cheapPeriod.id;

    // Solar generation
    const generationKw = estimateGeneration(point.start, solarConfig, scalingFactor);
    const generationKwh = generationKw * intervalHours;
    const consumptionKwh = point.consumption;

    let consumed = 0;
    let exported = 0;
    let batteryCharged = 0;
    let batteryDischarged = 0;
    let action: 'charging' | 'discharging' | 'idle' = 'idle';
    let powerFlow = 0;

    // Priority: 1) Direct consumption, 2) Battery charging, 3) Export
    let availableSolar = generationKwh;
    let remainingDemand = consumptionKwh;

    // Direct consumption from solar
    const directUse = Math.min(availableSolar, remainingDemand);
    consumed += directUse;
    availableSolar -= directUse;
    remainingDemand -= directUse;

    // Charge battery from excess solar (if space available)
    if (availableSolar > 0 && stateOfCharge < maxSoc) {
      const maxCharge = Math.min(
        maxSoc - stateOfCharge,
        batteryConfig.chargeRate * intervalHours,
        availableSolar
      );
      const actualCharge = maxCharge * (batteryConfig.roundtripEfficiency / 100);
      stateOfCharge += actualCharge;
      batteryCharged = maxCharge;
      availableSolar -= maxCharge;
      action = 'charging';
      powerFlow = maxCharge / intervalHours;
    }

    // Discharge battery to meet remaining demand (during expensive periods)
    if (remainingDemand > 0 && stateOfCharge > minSoc && !isCheapPeriod) {
      const maxDischarge = Math.min(
        stateOfCharge - minSoc,
        batteryConfig.dischargeRate * intervalHours,
        remainingDemand
      );
      stateOfCharge -= maxDischarge;
      batteryDischarged = maxDischarge;
      consumed += maxDischarge;
      remainingDemand -= maxDischarge;
      action = 'discharging';
      powerFlow = -maxDischarge / intervalHours;
    }

    // Charge battery from grid during cheap period (if still has space)
    if (isCheapPeriod && stateOfCharge < maxSoc && action === 'idle') {
      const maxGridCharge = Math.min(
        maxSoc - stateOfCharge,
        batteryConfig.chargeRate * intervalHours
      );
      const actualGridCharge = maxGridCharge * (batteryConfig.roundtripEfficiency / 100);
      stateOfCharge += actualGridCharge;
      action = 'charging';
      powerFlow = maxGridCharge / intervalHours;
    }

    // Export excess solar
    exported = availableSolar;

    // Ensure SOC within limits
    stateOfCharge = Math.max(minSoc, Math.min(maxSoc, stateOfCharge));

    // Accumulate totals
    totalGeneration += generationKwh;
    totalExported += exported;
    totalSelfConsumed += consumed;
    totalBatteryCharged += batteryCharged;
    totalBatteryDischarged += batteryDischarged;

    // Calculate savings
    exportEarnings += exported * exportRate;
    importSavings += consumed * currentRate.ratePerKwh;

    generations.push({
      timestamp: point.start,
      generation: generationKw,
      consumed: consumed / intervalHours,
      exported: exported / intervalHours,
      batteryCharged: batteryCharged / intervalHours,
    });

    batteryStates.push({
      timestamp: point.start,
      stateOfCharge,
      socPercentage: (stateOfCharge / batteryConfig.capacity) * 100,
      action,
      powerFlow,
    });
  }

  const totalSavings = exportEarnings + importSavings;
  const days = data.length / 48;
  const dailyAverageSavings = totalSavings / days;
  const annualEstimate = dailyAverageSavings * 365;

  const systemCost = (solarConfig.cost || solarConfig.capacity * 1200) +
                     (batteryConfig.cost || batteryConfig.capacity * 500);
  const paybackPeriod = annualEstimate > 0 ? systemCost / annualEstimate : Infinity;

  const totalConsumption = data.reduce((sum, p) => sum + p.consumption, 0);
  const selfSufficiencyRate = totalConsumption > 0 ?
    ((totalSelfConsumed + totalBatteryDischarged) / totalConsumption) * 100 : 0;

  return {
    solarConfig,
    batteryConfig,
    totalGeneration,
    totalExported,
    totalSelfConsumed,
    totalBatteryCharged,
    totalBatteryDischarged,
    exportEarnings,
    importSavings,
    totalSavings,
    dailyAverageSavings,
    annualEstimate,
    paybackPeriod,
    selfSufficiencyRate,
    generations,
    batteryStates,
  };
}

/**
 * Get common solar system presets
 */
export function getSolarPresets() {
  return [
    {
      name: 'Small System (3 kW)',
      capacity: 3.0,
      panelEfficiency: 20,
      systemEfficiency: 85,
      orientation: 'south' as const,
      tilt: 35,
      cost: 3600,
      description: 'Suitable for small homes, 8-10 panels',
    },
    {
      name: 'Medium System (4 kW)',
      capacity: 4.0,
      panelEfficiency: 20,
      systemEfficiency: 85,
      orientation: 'south' as const,
      tilt: 35,
      cost: 4800,
      description: 'Good for average homes, 10-12 panels',
    },
    {
      name: 'Large System (6 kW)',
      capacity: 6.0,
      panelEfficiency: 20,
      systemEfficiency: 85,
      orientation: 'south' as const,
      tilt: 35,
      cost: 7200,
      description: 'For larger homes, 15-18 panels',
    },
    {
      name: 'Premium System (8 kW)',
      capacity: 8.0,
      panelEfficiency: 22,
      systemEfficiency: 90,
      orientation: 'south' as const,
      tilt: 35,
      cost: 10400,
      description: 'High-efficiency system for maximum generation',
    },
  ];
}

/**
 * Recommend solar system size based on consumption
 */
export function recommendSolarSize(
  data: ConsumptionDataPoint[]
): { recommendedCapacity: number; reasoning: string } {
  if (data.length === 0) {
    return {
      recommendedCapacity: 4.0,
      reasoning: 'No data available for analysis',
    };
  }

  // Calculate average daily consumption
  const dataIntervals = data.length;
  const intervalsPerDay = 48;
  const days = dataIntervals / intervalsPerDay;
  const totalConsumption = data.reduce((sum, p) => sum + p.consumption, 0);
  const avgDailyConsumption = totalConsumption / days;

  // Typical UK solar system generates ~3.5 kWh per kW of capacity per day (annual average)
  // Recommend system to cover 80-100% of annual consumption
  const recommendedCapacity = Math.ceil((avgDailyConsumption / 3.5) * 10) / 10;

  // Round to nearest 0.5 kW
  const roundedCapacity = Math.round(recommendedCapacity * 2) / 2;
  const cappedCapacity = Math.min(Math.max(roundedCapacity, 3.0), 10.0);

  return {
    recommendedCapacity: cappedCapacity,
    reasoning: `Based on your average daily consumption of ${avgDailyConsumption.toFixed(1)} kWh, a ${cappedCapacity} kW solar system would generate approximately ${(cappedCapacity * 3.5).toFixed(1)} kWh per day (annual average), covering around ${((cappedCapacity * 3.5 / avgDailyConsumption) * 100).toFixed(0)}% of your consumption.`,
  };
}
