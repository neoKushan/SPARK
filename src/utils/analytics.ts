/**
 * Analytics utility for Umami event tracking
 * Privacy-first analytics - no personal data is collected
 */

// Type definition for umami global function
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}

/**
 * Track a custom event in Umami
 * @param eventName - Name of the event (e.g., 'csv-upload', 'example-profile')
 * @param eventData - Optional data associated with the event
 */
export function trackEvent(eventName: string, eventData?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, eventData);
  }
}

/**
 * Track when user uploads a CSV file
 */
export function trackCsvUpload() {
  trackEvent('csv-upload');
}

/**
 * Track when user selects an example profile
 * @param profileName - Name of the profile (e.g., 'typical-home', 'ev-owner')
 */
export function trackExampleProfile(profileName: string) {
  trackEvent('example-profile', { profile: profileName });
}

/**
 * Track when user enters manual consumption data
 * @param annualKwh - Annual kWh entered (rounded to nearest 100 for privacy)
 */
export function trackManualEntry(annualKwh: number) {
  const rounded = Math.round(annualKwh / 100) * 100;
  trackEvent('manual-entry', { range: `${rounded}` });
}

/**
 * Track when user switches tabs
 * @param tabName - Name of the tab (consumption, pricing, battery, solar, summary)
 */
export function trackTabSwitch(tabName: string) {
  trackEvent('tab-switch', { tab: tabName });
}

/**
 * Track when user configures battery
 * @param capacity - Battery capacity in kWh (rounded to nearest 5)
 */
export function trackBatteryConfig(capacity: number) {
  const rounded = Math.round(capacity / 5) * 5;
  trackEvent('battery-config', { capacity: `${rounded}kWh` });
}

/**
 * Track when user configures solar
 * @param capacity - Solar capacity in kWp (rounded to nearest 1)
 */
export function trackSolarConfig(capacity: number) {
  const rounded = Math.round(capacity);
  trackEvent('solar-config', { capacity: `${rounded}kWp` });
}

/**
 * Track when user changes tariff
 * @param tariffType - Type of tariff (preset or custom)
 */
export function trackTariffChange(tariffType: 'preset' | 'custom') {
  trackEvent('tariff-change', { type: tariffType });
}

/**
 * Track when user shares configuration
 */
export function trackShareConfig() {
  trackEvent('share-config');
}
