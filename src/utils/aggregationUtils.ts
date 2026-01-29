import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isWithinInterval,
  differenceInDays,
} from 'date-fns';
import type {
  ConsumptionDataPoint,
  AggregatedData,
  TimeFrame,
  DateRange,
} from '@/types/consumption';

/**
 * Aggregate consumption data by the specified time frame
 */
export function aggregateByTimeFrame(
  data: ConsumptionDataPoint[],
  timeFrame: TimeFrame,
  dateRange?: DateRange
): AggregatedData[] {
  // Filter data by date range if provided
  const filteredData = dateRange
    ? data.filter((point) =>
        isWithinInterval(point.start, { start: dateRange.start, end: dateRange.end })
      )
    : data;

  if (filteredData.length === 0) {
    return [];
  }

  switch (timeFrame) {
    case 'day':
      return aggregateByDay(filteredData);
    case 'week':
      return aggregateByWeek(filteredData);
    case 'month':
      return aggregateByMonth(filteredData);
    case 'year':
      return aggregateByYear(filteredData);
    case 'all':
      return [aggregateAll(filteredData)];
    default:
      return aggregateByDay(filteredData);
  }
}

/**
 * Aggregate data by day
 */
export function aggregateByDay(data: ConsumptionDataPoint[]): AggregatedData[] {
  const grouped = groupBy(data, (point) => format(startOfDay(point.start), 'yyyy-MM-dd'));
  return Array.from(grouped.entries())
    .map(([date, points]) => createAggregatedData(date, points))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Aggregate data by week
 */
export function aggregateByWeek(data: ConsumptionDataPoint[]): AggregatedData[] {
  const grouped = groupBy(data, (point) => {
    const weekStart = startOfWeek(point.start, { weekStartsOn: 1 }); // Monday
    return format(weekStart, 'yyyy-MM-dd');
  });

  return Array.from(grouped.entries())
    .map(([week, points]) => {
      const weekLabel = `Week of ${week}`;
      return createAggregatedData(weekLabel, points);
    })
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Aggregate data by month
 */
export function aggregateByMonth(data: ConsumptionDataPoint[]): AggregatedData[] {
  const grouped = groupBy(data, (point) => format(startOfMonth(point.start), 'yyyy-MM'));
  return Array.from(grouped.entries())
    .map(([month, points]) => {
      const monthLabel = format(new Date(month + '-01'), 'MMM yyyy');
      return createAggregatedData(monthLabel, points);
    })
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Aggregate data by year
 */
export function aggregateByYear(data: ConsumptionDataPoint[]): AggregatedData[] {
  const grouped = groupBy(data, (point) => format(startOfYear(point.start), 'yyyy'));
  return Array.from(grouped.entries())
    .map(([year, points]) => createAggregatedData(year, points))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Aggregate all data into a single period
 */
export function aggregateAll(data: ConsumptionDataPoint[]): AggregatedData {
  const start = data[0].start;
  const end = data[data.length - 1].end;
  const days = differenceInDays(end, start);
  const period = `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')} (${days} days)`;
  return createAggregatedData(period, data);
}

/**
 * Helper: Group data points by a key function
 */
function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
}

/**
 * Helper: Create aggregated data from a group of points
 */
function createAggregatedData(
  period: string,
  points: ConsumptionDataPoint[]
): AggregatedData {
  const totalConsumption = points.reduce((sum, p) => sum + p.consumption, 0);
  const peakConsumption = Math.max(...points.map((p) => p.consumption));
  const peakPoint = points.find((p) => p.consumption === peakConsumption)!;

  return {
    period,
    totalConsumption,
    averageConsumption: totalConsumption / points.length,
    peakConsumption,
    peakTime: peakPoint.start,
    dataPointCount: points.length,
  };
}

/**
 * Get statistics for a dataset
 */
export function calculateStatistics(data: ConsumptionDataPoint[]) {
  if (data.length === 0) {
    return null;
  }

  const consumptions = data.map((p) => p.consumption);
  const total = consumptions.reduce((sum, c) => sum + c, 0);
  const average = total / consumptions.length;
  const min = Math.min(...consumptions);
  const max = Math.max(...consumptions);

  // Calculate median
  const sorted = [...consumptions].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Calculate standard deviation
  const variance = consumptions.reduce((sum, c) => sum + Math.pow(c - average, 2), 0) / consumptions.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    totalConsumption: total,
    averageConsumption: average,
    minConsumption: min,
    maxConsumption: max,
    medianConsumption: median,
    standardDeviation,
    dataPoints: data.length,
    dateRange: {
      start: data[0].start,
      end: data[data.length - 1].end,
    },
  };
}

/**
 * Downsample data for chart performance
 * Reduces the number of points by averaging groups of consecutive points
 */
export function downsampleData(
  data: ConsumptionDataPoint[],
  maxPoints: number
): ConsumptionDataPoint[] {
  if (data.length <= maxPoints) {
    return data;
  }

  const samplingRate = Math.ceil(data.length / maxPoints);
  const downsampled: ConsumptionDataPoint[] = [];

  for (let i = 0; i < data.length; i += samplingRate) {
    const group = data.slice(i, Math.min(i + samplingRate, data.length));
    const avgConsumption = group.reduce((sum, p) => sum + p.consumption, 0) / group.length;

    downsampled.push({
      consumption: avgConsumption,
      start: group[0].start,
      end: group[group.length - 1].end,
    });
  }

  return downsampled;
}

/**
 * Filter data by date range
 */
export function filterByDateRange(
  data: ConsumptionDataPoint[],
  range: DateRange
): ConsumptionDataPoint[] {
  return data.filter((point) =>
    isWithinInterval(point.start, { start: range.start, end: range.end })
  );
}

/**
 * Get hourly breakdown for a specific day
 */
export function getHourlyBreakdown(data: ConsumptionDataPoint[], date: Date): AggregatedData[] {
  const dayStart = startOfDay(date);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const dayData = data.filter((point) =>
    isWithinInterval(point.start, { start: dayStart, end: dayEnd })
  );

  const grouped = groupBy(dayData, (point) => format(point.start, 'HH:00'));

  return Array.from(grouped.entries())
    .map(([hour, points]) => createAggregatedData(hour, points))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Find periods of high consumption (above threshold)
 */
export function findHighConsumptionPeriods(
  data: ConsumptionDataPoint[],
  thresholdPercentile: number = 90
): ConsumptionDataPoint[] {
  const sorted = [...data].sort((a, b) => a.consumption - b.consumption);
  const thresholdIndex = Math.floor((thresholdPercentile / 100) * sorted.length);
  const threshold = sorted[thresholdIndex].consumption;

  return data.filter((point) => point.consumption >= threshold);
}
