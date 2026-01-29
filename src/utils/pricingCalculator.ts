import { format } from 'date-fns';
import type {
  ConsumptionDataPoint,
  RatePeriod,
  CostDataPoint,
} from '@/types/consumption';

/**
 * Match a timestamp to the appropriate rate period
 */
export function matchRatePeriod(timestamp: Date, ratePeriods: RatePeriod[]): RatePeriod {
  const time = format(timestamp, 'HH:mm');

  for (const period of ratePeriods) {
    if (isTimeInRange(time, period.startTime, period.endTime)) {
      return period;
    }
  }

  // Default to first period if no match
  return ratePeriods[0];
}

/**
 * Check if a time falls within a rate period range
 * Handles cross-midnight periods (e.g., 23:30-05:00)
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  // Cross-midnight period
  if (startTime > endTime) {
    return time >= startTime || time < endTime;
  }
  // Normal period
  return time >= startTime && time < endTime;
}

/**
 * Calculate cost for a single consumption data point
 */
export function calculateCost(
  point: ConsumptionDataPoint,
  ratePeriods: RatePeriod[]
): CostDataPoint {
  const ratePeriod = matchRatePeriod(point.start, ratePeriods);
  const cost = point.consumption * ratePeriod.ratePerKwh;

  return {
    consumption: point.consumption,
    cost,
    ratePeriod,
    timestamp: point.start,
  };
}

/**
 * Calculate costs for all consumption data
 */
export function calculateAllCosts(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): CostDataPoint[] {
  return data.map((point) => calculateCost(point, ratePeriods));
}

/**
 * Calculate total cost for all consumption data
 */
export function calculateTotalCost(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): number {
  return data.reduce((total, point) => {
    const ratePeriod = matchRatePeriod(point.start, ratePeriods);
    return total + (point.consumption * ratePeriod.ratePerKwh);
  }, 0);
}

/**
 * Calculate cost breakdown by rate period
 */
export function calculateCostBreakdown(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): Map<string, { consumption: number; cost: number; ratePeriod: RatePeriod }> {
  const breakdown = new Map<string, { consumption: number; cost: number; ratePeriod: RatePeriod }>();

  // Initialize breakdown for each rate period
  ratePeriods.forEach((period) => {
    breakdown.set(period.id, {
      consumption: 0,
      cost: 0,
      ratePeriod: period,
    });
  });

  // Accumulate consumption and cost for each period
  data.forEach((point) => {
    const ratePeriod = matchRatePeriod(point.start, ratePeriods);
    const existing = breakdown.get(ratePeriod.id)!;
    existing.consumption += point.consumption;
    existing.cost += point.consumption * ratePeriod.ratePerKwh;
  });

  return breakdown;
}

/**
 * Add cost information to aggregated data
 */
export function addCostsToAggregatedData(
  aggregated: any[],
  rawData: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): any[] {
  return aggregated.map((agg) => {
    // Find all raw data points that fall within this aggregated period
    // This is a simplified approach - for production, you'd want more precise date matching
    const periodData = rawData.filter((point) => {
      const pointDate = format(point.start, 'yyyy-MM-dd');
      return agg.period.includes(pointDate) || pointDate.includes(agg.period);
    });

    if (periodData.length === 0) {
      return agg;
    }

    const totalCost = calculateTotalCost(periodData, ratePeriods);
    const costBreakdownMap = calculateCostBreakdown(periodData, ratePeriods);

    // Convert Map to simple object for easier serialization
    const costByRate = new Map<string, number>();
    costBreakdownMap.forEach((value, key) => {
      costByRate.set(key, value.cost);
    });

    return {
      ...agg,
      totalCost,
      costByRate,
    };
  });
}

/**
 * Calculate estimated annual cost
 */
export function calculateAnnualCost(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): number {
  const totalCost = calculateTotalCost(data, ratePeriods);
  const dataIntervals = data.length;
  const intervalsPerDay = 48; // 30-minute intervals
  const daysInData = dataIntervals / intervalsPerDay;

  // Extrapolate to annual cost
  return (totalCost / daysInData) * 365;
}

/**
 * Calculate average cost per kWh (effective rate)
 */
export function calculateAverageCostPerKwh(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[]
): number {
  const totalConsumption = data.reduce((sum, point) => sum + point.consumption, 0);
  const totalCost = calculateTotalCost(data, ratePeriods);

  return totalConsumption > 0 ? totalCost / totalConsumption : 0;
}

/**
 * Find most expensive periods
 */
export function findMostExpensivePeriods(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[],
  limit: number = 10
): CostDataPoint[] {
  const costsData = calculateAllCosts(data, ratePeriods);
  return costsData
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}

/**
 * Calculate potential savings by shifting consumption to cheaper periods
 */
export function calculateShiftingSavings(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[],
  shiftablePercentage: number = 0.3 // 30% of consumption could be shifted
): {
  currentCost: number;
  potentialCost: number;
  savings: number;
  savingsPercentage: number;
} {
  const currentCost = calculateTotalCost(data, ratePeriods);
  const totalConsumption = data.reduce((sum, point) => sum + point.consumption, 0);
  const shiftableConsumption = totalConsumption * shiftablePercentage;

  // Find cheapest rate
  const cheapestRate = Math.min(...ratePeriods.map((p) => p.ratePerKwh));
  const mostExpensiveRate = Math.max(...ratePeriods.map((p) => p.ratePerKwh));

  // Calculate savings if shiftable consumption was moved to cheapest period
  const shiftingSavings = shiftableConsumption * (mostExpensiveRate - cheapestRate);
  const potentialCost = currentCost - shiftingSavings;

  return {
    currentCost,
    potentialCost,
    savings: shiftingSavings,
    savingsPercentage: (shiftingSavings / currentCost) * 100,
  };
}
