import type { ConsumptionDataPoint } from '@/types/consumption';

export interface ExampleProfile {
  id: string;
  name: string;
  description: string;
  avgDailyConsumption: number;
  icon: string;
}

export const exampleProfiles: ExampleProfile[] = [
  {
    id: 'low',
    name: 'Low Usage',
    description: '1-2 person flat or small home',
    avgDailyConsumption: 8.5, // ~3,100 kWh/year
    icon: '🏠',
  },
  {
    id: 'medium',
    name: 'Medium Usage',
    description: '3-4 person family home',
    avgDailyConsumption: 14.0, // ~5,100 kWh/year
    icon: '🏡',
  },
  {
    id: 'high',
    name: 'High Usage',
    description: 'Large home or electric heating',
    avgDailyConsumption: 22.0, // ~8,000 kWh/year
    icon: '🏘️',
  },
];

/**
 * Generate 12 months of realistic consumption data for an example profile
 */
export function generateExampleConsumption(profile: ExampleProfile): ConsumptionDataPoint[] {
  const data: ConsumptionDataPoint[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12); // Start 12 months ago
  startDate.setHours(0, 0, 0, 0);

  // Seasonal multipliers (winter higher, summer lower)
  const seasonalMultipliers = [
    1.3, // January
    1.25, // February
    1.15, // March
    1.0, // April
    0.85, // May
    0.75, // June
    0.7, // July
    0.75, // August
    0.85, // September
    1.0, // October
    1.15, // November
    1.25, // December
  ];

  // Generate 365 days of data
  for (let day = 0; day < 365; day++) {
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

      const avgPer30Min = profile.avgDailyConsumption / 48;
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
