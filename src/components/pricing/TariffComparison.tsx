import { useMemo } from 'react';
import { TrendingUp, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataStore } from '@/context/DataContext';
import { getTariffPresets, calculateArbitrageSpread, calculateOffPeakHours } from '@/utils/tariffPresets';
import { simulateSolar, simulateSolarWithBattery } from '@/utils/solarSimulator';
import { simulateBattery } from '@/utils/batterySimulator';
import type { EnergyTariff, ConsumptionDataPoint, RatePeriod } from '@/types/consumption';

interface TariffAnalysisResult {
  tariff: EnergyTariff;
  annualSavings: number;
  paybackPeriod: number;
  totalSystemCost: number;
  arbitrageSpread: number;
  offPeakHours: number;
  isConsumptionOnly: boolean;
}

// Helper function to calculate annual consumption cost
function calculateAnnualConsumptionCost(
  data: ConsumptionDataPoint[],
  ratePeriods: RatePeriod[],
  standingCharge: number = 0
): number {
  let totalCost = 0;

  for (const point of data) {
    const hour = point.start.getHours();
    const minute = point.start.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Find matching rate period
    let applicableRate = ratePeriods[0].ratePerKwh;
    for (const period of ratePeriods) {
      const [startHour, startMin] = period.startTime.split(':').map(Number);
      const [endHour, endMin] = period.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Handle cross-midnight periods
      if (startMinutes > endMinutes) {
        if (timeInMinutes >= startMinutes || timeInMinutes < endMinutes) {
          applicableRate = period.ratePerKwh;
          break;
        }
      } else {
        if (timeInMinutes >= startMinutes && timeInMinutes < endMinutes) {
          applicableRate = period.ratePerKwh;
          break;
        }
      }
    }

    totalCost += point.consumption * applicableRate;
  }

  // Add standing charge (convert from pence/day to pounds/year)
  const daysInData = (data[data.length - 1].end.getTime() - data[0].start.getTime()) / (1000 * 60 * 60 * 24);
  const annualStandingCharge = (standingCharge / 100) * 365;

  // Scale to annual if we have less than a year of data
  const annualMultiplier = 365 / Math.max(daysInData, 1);

  return (totalCost * annualMultiplier) + annualStandingCharge;
}

export function TariffComparison() {
  const {
    consumptionData,
    solarConfig,
    batteryConfig,
    currentTariffId,
    ratePeriods,
    exportRate,
    customTariffName,
    customStandingCharge,
  } = useDataStore();

  const tariffPresets = getTariffPresets();

  // Create custom tariff object from current state
  const customTariff: EnergyTariff | null = useMemo(() => {
    if (currentTariffId === null) {
      return {
        id: 'custom',
        provider: 'Custom',
        name: customTariffName,
        ratePeriods: ratePeriods,
        exportRate: exportRate,
        standingCharge: customStandingCharge,
        notes: 'Your custom configured tariff',
      };
    }
    return null;
  }, [currentTariffId, customTariffName, ratePeriods, exportRate, customStandingCharge]);

  // Include custom tariff in the list if it exists
  const allTariffs = useMemo(() => {
    if (customTariff) {
      return [...tariffPresets, customTariff];
    }
    return tariffPresets;
  }, [tariffPresets, customTariff]);

  // Analyze each tariff with current solar/battery configuration
  const tariffAnalysis = useMemo<TariffAnalysisResult[]>(() => {
    if (consumptionData.length === 0) return [];

    const isConsumptionOnly = !solarConfig && !batteryConfig;

    return allTariffs.map((tariff) => {
      let annualSavings = 0;
      let paybackPeriod = Infinity;
      let totalSystemCost = 0;

      // Calculate system cost
      if (solarConfig && solarConfig.cost) {
        totalSystemCost += solarConfig.cost;
      } else if (solarConfig) {
        totalSystemCost += solarConfig.capacity * 1200; // Estimate
      }

      if (batteryConfig && batteryConfig.cost) {
        totalSystemCost += batteryConfig.cost;
      } else if (batteryConfig) {
        totalSystemCost += batteryConfig.capacity * 500; // Estimate
      }

      // Run simulation based on configuration
      if (solarConfig && batteryConfig) {
        const analysis = simulateSolarWithBattery(
          consumptionData,
          solarConfig,
          batteryConfig,
          tariff.ratePeriods,
          tariff.exportRate
        );
        annualSavings = analysis.annualEstimate;
        paybackPeriod = analysis.paybackPeriod;
      } else if (solarConfig) {
        const analysis = simulateSolar(
          consumptionData,
          solarConfig,
          tariff.ratePeriods,
          tariff.exportRate
        );
        annualSavings = analysis.annualEstimate;
        paybackPeriod = analysis.paybackPeriod;
      } else if (batteryConfig) {
        const analysis = simulateBattery(
          consumptionData,
          batteryConfig,
          tariff.ratePeriods
        );
        annualSavings = analysis.annualEstimate;
        paybackPeriod = analysis.paybackPeriod;
      } else {
        // Consumption only - calculate annual cost for this tariff
        // Store as negative value so lower cost = higher "savings"
        const annualCost = calculateAnnualConsumptionCost(
          consumptionData,
          tariff.ratePeriods,
          tariff.standingCharge
        );
        annualSavings = -annualCost;
      }

      return {
        tariff,
        annualSavings,
        paybackPeriod,
        totalSystemCost,
        arbitrageSpread: calculateArbitrageSpread(tariff),
        offPeakHours: calculateOffPeakHours(tariff),
        isConsumptionOnly,
      };
    });
  }, [consumptionData, solarConfig, batteryConfig, allTariffs]);

  // Sort by annual savings (best first)
  const sortedAnalysis = useMemo(() => {
    return [...tariffAnalysis].sort((a, b) => b.annualSavings - a.annualSavings);
  }, [tariffAnalysis]);

  const bestTariff = sortedAnalysis[0];

  if (consumptionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tariff Comparison
          </CardTitle>
          <CardDescription>No data available for comparison</CardDescription>
        </CardHeader>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      {/* Best Tariff Highlight */}
      {bestTariff && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recommended Tariff
            </CardTitle>
            <CardDescription>
              {bestTariff.isConsumptionOnly
                ? 'Lowest cost tariff for your consumption'
                : `Best tariff for your ${solarConfig && batteryConfig ? 'solar + battery' : solarConfig ? 'solar' : 'battery'} system`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{bestTariff.tariff.provider}</div>
                <div className="text-xl text-muted-foreground">{bestTariff.tariff.name}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className={`p-4 rounded-lg border ${bestTariff.isConsumptionOnly ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                  <div className="text-sm text-muted-foreground mb-1">
                    {bestTariff.isConsumptionOnly ? 'Annual Cost' : 'Annual Savings'}
                  </div>
                  <div className={`text-2xl font-bold ${bestTariff.isConsumptionOnly ? 'text-blue-600' : 'text-green-600'}`}>
                    £{Math.abs(bestTariff.annualSavings).toFixed(2)}
                  </div>
                </div>

                {!bestTariff.isConsumptionOnly && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
                    <div className="text-2xl font-bold">
                      {bestTariff.paybackPeriod < 100
                        ? `${bestTariff.paybackPeriod.toFixed(1)} years`
                        : 'N/A'}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Export Rate</div>
                  <div className="text-2xl font-bold">
                    {(bestTariff.tariff.exportRate * 100).toFixed(1)}p/kWh
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tariff Comparison</CardTitle>
          <CardDescription>
            {bestTariff?.isConsumptionOnly
              ? 'Compare annual costs across all available tariffs'
              : 'Compare annual savings and payback periods across all available tariffs'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAnalysis.map((result, index) => {
              const isBest = index === 0;
              return (
                <div
                  key={result.tariff.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isBest ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-lg">
                          {result.tariff.provider} - {result.tariff.name}
                        </div>
                        {isBest && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            BEST
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <Zap className="w-3 h-3 inline mr-1" />
                          {result.offPeakHours.toFixed(1)}h off-peak
                        </div>
                        <div>
                          <DollarSign className="w-3 h-3 inline mr-1" />
                          {(result.arbitrageSpread * 100).toFixed(1)}p spread
                        </div>
                        <div>Export: {(result.tariff.exportRate * 100).toFixed(1)}p/kWh</div>
                        {result.tariff.standingCharge !== undefined && (
                          <div>Standing: {result.tariff.standingCharge.toFixed(1)}p/day</div>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className={`text-2xl font-bold ${result.isConsumptionOnly ? 'text-blue-600' : 'text-green-600'}`}>
                        £{Math.abs(result.annualSavings).toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.isConsumptionOnly ? 'per year' : 'saved/year'}
                      </div>
                      {!result.isConsumptionOnly && (
                        <div className="text-sm text-muted-foreground">
                          {result.paybackPeriod < 100
                            ? `${result.paybackPeriod.toFixed(1)}y payback`
                            : 'N/A payback'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
            <p>
              <strong>How to read this:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Off-peak hours:</strong> More hours = {bestTariff?.isConsumptionOnly ? 'cheaper electricity' : 'more time to charge battery cheaply'}
              </li>
              <li>
                <strong>Spread:</strong> Difference between peak and off-peak rates (higher is better for
                batteries)
              </li>
              <li>
                <strong>Export rate:</strong> What you earn for solar exports (higher is better)
              </li>
              <li>
                <strong>{bestTariff?.isConsumptionOnly ? 'Annual cost' : 'Annual savings'}:</strong> {bestTariff?.isConsumptionOnly ? 'Estimated yearly cost for your consumption' : 'Estimated yearly savings compared to grid-only usage'}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
