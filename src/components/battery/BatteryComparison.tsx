import { useMemo } from 'react';
import { TrendingUp, Battery, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BatteryConfig, ConsumptionDataPoint, RatePeriod } from '@/types/consumption';
import { simulateBattery } from '@/utils/batterySimulator';

interface BatteryComparisonProps {
  configs: BatteryConfig[];
  consumptionData: ConsumptionDataPoint[];
  ratePeriods: RatePeriod[];
  onSelectConfig?: (config: BatteryConfig) => void;
}

export function BatteryComparison({ configs, consumptionData, ratePeriods, onSelectConfig }: BatteryComparisonProps) {
  const analyses = useMemo(() => {
    if (consumptionData.length === 0) return [];
    return configs.map((config) => ({
      config,
      analysis: simulateBattery(consumptionData, config, ratePeriods),
    }));
  }, [configs, consumptionData, ratePeriods]);

  if (analyses.length === 0) {
    return null;
  }

  // Find best option based on ROI
  const bestRoi = analyses.reduce((best, current) => {
    const currentRoi = current.analysis.annualEstimate / (current.config.cost || current.config.capacity * 500);
    const bestRoiVal = best.analysis.annualEstimate / (best.config.cost || best.config.capacity * 500);
    return currentRoi > bestRoiVal ? current : best;
  }, analyses[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left p-3 font-medium">Configuration</th>
                <th className="text-right p-3 font-medium">Capacity</th>
                <th className="text-right p-3 font-medium">Cost</th>
                <th className="text-right p-3 font-medium">Annual Savings</th>
                <th className="text-right p-3 font-medium">Payback Period</th>
                <th className="text-right p-3 font-medium">Self-Sufficiency</th>
                <th className="text-right p-3 font-medium">ROI</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map(({ config, analysis }) => {
                const cost = config.cost || config.capacity * 500;
                const roi = (analysis.annualEstimate / cost) * 100;
                const isBest = config.id === bestRoi.config.id;

                return (
                  <tr
                    key={config.id || config.name}
                    className={`border-b hover:bg-accent/50 transition-colors cursor-pointer ${
                      isBest ? 'bg-primary/5 border-primary' : ''
                    }`}
                    onClick={() => onSelectConfig?.(config)}
                  >
                    <td className="p-3">
                      <div className="font-medium">{config.name}</div>
                      {isBest && (
                        <span className="text-xs text-primary font-semibold">Best ROI</span>
                      )}
                    </td>
                    <td className="text-right p-3">{config.capacity} kWh</td>
                    <td className="text-right p-3">£{cost.toLocaleString()}</td>
                    <td className="text-right p-3 text-green-600 font-semibold">
                      £{analysis.annualEstimate.toFixed(2)}
                    </td>
                    <td className="text-right p-3">
                      {analysis.paybackPeriod < 100
                        ? `${analysis.paybackPeriod.toFixed(1)} years`
                        : 'N/A'}
                    </td>
                    <td className="text-right p-3">{analysis.selfConsumptionRate.toFixed(1)}%</td>
                    <td className="text-right p-3 font-semibold">{roi.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {analyses.map(({ config, analysis }) => {
            const cost = config.cost || config.capacity * 500;
            const isBest = config.id === bestRoi.config.id;

            return (
              <div
                key={config.id || config.name}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-primary ${
                  isBest ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelectConfig?.(config)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{config.name}</div>
                    <div className="text-xs text-muted-foreground">{config.capacity} kWh</div>
                  </div>
                  {isBest && <Battery className="w-5 h-5 text-primary" />}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium">£{cost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Annual Savings
                    </span>
                    <span className="font-medium text-green-600">
                      £{analysis.annualEstimate.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Payback
                    </span>
                    <span className="font-medium">
                      {analysis.paybackPeriod < 100
                        ? `${analysis.paybackPeriod.toFixed(1)}y`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Self-Sufficiency
                    </span>
                    <span className="font-medium">{analysis.selfConsumptionRate.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
