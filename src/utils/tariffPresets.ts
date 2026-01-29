import type { EnergyTariff } from '@/types/consumption';

/**
 * Predefined energy tariffs with import and export rates
 * Based on UK energy providers with solar export support
 */
export function getTariffPresets(): EnergyTariff[] {
  return [
    {
      id: 'octopus-intelligent-go',
      provider: 'Octopus Energy',
      name: 'Intelligent Octopus Go',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '23:30',
          endTime: '05:30',
          ratePerKwh: 0.07,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '05:30',
          endTime: '23:30',
          ratePerKwh: 0.27,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.15,
      standingCharge: 55,
      notes: 'EV Required: Best import rate. Compatible with most batteries for charging.',
    },
    {
      id: 'octopus-flux',
      provider: 'Octopus Energy',
      name: 'Flux',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '02:00',
          endTime: '05:00',
          ratePerKwh: 0.167,
          color: '#10b981', // green
        },
        {
          id: 'day',
          name: 'Day',
          startTime: '05:00',
          endTime: '16:00',
          ratePerKwh: 0.28,
          color: '#3b82f6', // blue
        },
        {
          id: 'peak',
          name: 'Peak',
          startTime: '16:00',
          endTime: '19:00',
          ratePerKwh: 0.39,
          color: '#ef4444', // red
        },
        {
          id: 'evening',
          name: 'Evening',
          startTime: '19:00',
          endTime: '02:00',
          ratePerKwh: 0.28,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.22,
      standingCharge: 50,
      notes: 'Open to all solar/battery users. 3-rate tariff (Off-Peak/Day/Peak).',
    },
    {
      id: 'eon-solar-max',
      provider: 'E.ON Next',
      name: 'Next Solar Max',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '00:00',
          endTime: '07:00',
          ratePerKwh: 0.067,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '07:00',
          endTime: '00:00',
          ratePerKwh: 0.282,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.165,
      standingCharge: 54,
      notes: 'High Arbitrage: 9.8p spread. Requires GivEnergy battery & SMETS2 meter.',
    },
    {
      id: 'edf-empower',
      provider: 'EDF',
      name: 'Empower Exclusive V2',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '01:00',
          endTime: '04:00',
          ratePerKwh: 0.177,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '04:00',
          endTime: '01:00',
          ratePerKwh: 0.277,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.24,
      standingCharge: 0,
      notes: 'Zero Standing Charge: Best for low users. Requires install via Contact Solar (EDF).',
    },
    {
      id: 'british-gas-charge-power',
      provider: 'British Gas',
      name: 'Charge Power',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '00:00',
          endTime: '05:00',
          ratePerKwh: 0.139,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '05:00',
          endTime: '00:00',
          ratePerKwh: 0.277,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.151,
      standingCharge: 55,
      notes: 'Hardware Agnostic: Great for third-party batteries (Sigenergy/Pylontech).',
    },
    {
      id: 'british-gas-ev-power',
      provider: 'British Gas',
      name: 'EV Power',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '12:00',
          endTime: '05:00',
          ratePerKwh: 0.09,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '05:00',
          endTime: '12:00',
          ratePerKwh: 0.277,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.151,
      standingCharge: 55,
      notes: 'Requires EV. Good alternative if you can\'t get Intelligent Octopus.',
    },
    {
      id: 'scottish-power-ev-saver',
      provider: 'Scottish Power',
      name: 'EV Saver',
      ratePeriods: [
        {
          id: 'cheap',
          name: 'Off-Peak',
          startTime: '00:00',
          endTime: '05:00',
          ratePerKwh: 0.072,
          color: '#10b981', // green
        },
        {
          id: 'standard',
          name: 'Peak',
          startTime: '05:00',
          endTime: '00:00',
          ratePerKwh: 0.277,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.135,
      standingCharge: 55,
      notes: 'Caution: Terms often exclude solar/battery households. Verify before switching.',
    },
    {
      id: 'good-energy-solar',
      provider: 'Good Energy',
      name: 'Solar Savings Exclusive',
      ratePeriods: [
        {
          id: 'standard',
          name: 'Standard',
          startTime: '00:00',
          endTime: '00:00',
          ratePerKwh: 0.277,
          color: '#3b82f6', // blue
        },
      ],
      exportRate: 0.25,
      standingCharge: 55,
      notes: 'Requires install by Good Energy / JPS Renewables.',
    },
  ];
}

/**
 * Get a tariff preset by ID
 */
export function getTariffById(id: string): EnergyTariff | undefined {
  return getTariffPresets().find((tariff) => tariff.id === id);
}

/**
 * Calculate the arbitrage spread for a tariff (max import - min import)
 * Higher spreads are better for battery arbitrage
 */
export function calculateArbitrageSpread(tariff: EnergyTariff): number {
  const rates = tariff.ratePeriods.map((p) => p.ratePerKwh);
  return Math.max(...rates) - Math.min(...rates);
}

/**
 * Calculate the off-peak hours duration for a tariff
 */
export function calculateOffPeakHours(tariff: EnergyTariff): number {
  let totalHours = 0;
  const minRate = Math.min(...tariff.ratePeriods.map((p) => p.ratePerKwh));

  for (const period of tariff.ratePeriods) {
    if (period.ratePerKwh === minRate) {
      const [startHour, startMin] = period.startTime.split(':').map(Number);
      const [endHour, endMin] = period.endTime.split(':').map(Number);

      let start = startHour + startMin / 60;
      let end = endHour + endMin / 60;

      // Handle cross-midnight periods
      if (end <= start) {
        end += 24;
      }

      totalHours += end - start;
    }
  }

  return totalHours;
}
