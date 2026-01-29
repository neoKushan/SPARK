import type { RatePeriod, BatteryConfig, SolarConfig } from '@/types/consumption';

interface UrlState {
  ratePeriods?: RatePeriod[];
  batteryConfig?: BatteryConfig;
  solarConfig?: SolarConfig;
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

  return state;
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
}
