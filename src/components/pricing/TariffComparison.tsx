import { useMemo } from 'react';
import { TrendingUp, DollarSign, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataStore } from '@/context/DataContext';
import { getTariffPresets, calculateArbitrageSpread, calculateOffPeakHours } from '@/utils/tariffPresets';
import { simulateSolar, simulateSolarWithBattery } from '@/utils/solarSimulator';
import { simulateBattery } from '@/utils/batterySimulator';
import type { EnergyTariff } from '@/types/consumption';

interface TariffAnalysisResult {
  tariff: EnergyTariff;
  annualSavings: number;
  paybackPeriod: number;
  totalSystemCost: number;
  arbitrageSpread: number;
  offPeakHours: number;
}

export function TariffComparison() {
  const {
    consumptionData,
    solarConfig,
    batteryConfig,
  } = useDataStore();

  const tariffPresets = getTariffPresets();

  // Analyze each tariff with current solar/battery configuration
  const tariffAnalysis = useMemo<TariffAnalysisResult[]>(() => {
    if (consumptionData.length === 0) return [];

    return tariffPresets.map((tariff) => {
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
      }

      return {
        tariff,
        annualSavings,
        paybackPeriod,
        totalSystemCost,
        arbitrageSpread: calculateArbitrageSpread(tariff),
        offPeakHours: calculateOffPeakHours(tariff),
      };
    });
  }, [consumptionData, solarConfig, batteryConfig, tariffPresets]);

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

  if (!solarConfig && !batteryConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tariff Comparison
          </CardTitle>
          <CardDescription>Configure solar or battery to compare tariffs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                Select a solar system in the <strong>Solar</strong> tab or a battery configuration
                in the <strong>Battery</strong> tab to see which energy tariff gives you the best
                return on investment.
              </p>
            </div>
          </div>
        </CardContent>
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
              Best tariff for your {solarConfig && batteryConfig ? 'solar + battery' : solarConfig ? 'solar' : 'battery'} system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{bestTariff.tariff.provider}</div>
                <div className="text-xl text-muted-foreground">{bestTariff.tariff.name}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-sm text-muted-foreground mb-1">Annual Savings</div>
                  <div className="text-2xl font-bold text-green-600">
                    £{bestTariff.annualSavings.toFixed(2)}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
                  <div className="text-2xl font-bold">
                    {bestTariff.paybackPeriod < 100
                      ? `${bestTariff.paybackPeriod.toFixed(1)} years`
                      : 'N/A'}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Export Rate</div>
                  <div className="text-2xl font-bold">
                    {(bestTariff.tariff.exportRate * 100).toFixed(1)}p/kWh
                  </div>
                </div>
              </div>

              {bestTariff.tariff.notes && (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  <strong>Note:</strong> {bestTariff.tariff.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tariff Comparison</CardTitle>
          <CardDescription>
            Compare annual savings and payback periods across all available tariffs
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
                      <div className="text-2xl font-bold text-green-600">
                        £{result.annualSavings.toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">per year</div>
                      <div className="text-sm text-muted-foreground">
                        {result.paybackPeriod < 100
                          ? `${result.paybackPeriod.toFixed(1)}y payback`
                          : 'N/A payback'}
                      </div>
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
                <strong>Off-peak hours:</strong> More hours = more time to charge battery cheaply
              </li>
              <li>
                <strong>Spread:</strong> Difference between peak and off-peak rates (higher is better for
                batteries)
              </li>
              <li>
                <strong>Export rate:</strong> What you earn for solar exports (higher is better)
              </li>
              <li>
                <strong>Annual savings:</strong> Estimated yearly savings compared to grid-only usage
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
