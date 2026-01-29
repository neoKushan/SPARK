import { useMemo } from 'react';
import { DollarSign, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RateConfiguration } from './RateConfiguration';
import { TariffComparison } from './TariffComparison';
import { useDataStore } from '@/context/DataContext';
import {
  calculateTotalCost,
  calculateCostBreakdown,
  calculateAnnualCost,
  calculateAverageCostPerKwh,
} from '@/utils/pricingCalculator';

export function PricingOverview() {
  const { consumptionData, ratePeriods } = useDataStore();

  const costData = useMemo(() => {
    if (consumptionData.length === 0) return null;

    const totalCost = calculateTotalCost(consumptionData, ratePeriods);
    const breakdown = calculateCostBreakdown(consumptionData, ratePeriods);
    const annualCost = calculateAnnualCost(consumptionData, ratePeriods);
    const avgCostPerKwh = calculateAverageCostPerKwh(consumptionData, ratePeriods);

    return {
      totalCost,
      breakdown: Array.from(breakdown.values()),
      annualCost,
      avgCostPerKwh,
    };
  }, [consumptionData, ratePeriods]);

  if (!costData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Analysis</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{costData.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">For current data period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Annual Cost</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{costData.annualCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on current usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{costData.avgCostPerKwh.toFixed(3)}/kWh</div>
            <p className="text-xs text-muted-foreground">Effective rate paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown by Rate Period */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Rate Period</CardTitle>
          <CardDescription>How much you spent during each rate period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costData.breakdown.map((item) => (
              <div key={item.ratePeriod.id} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.ratePeriod.color || '#3b82f6' }}
                    />
                    <span className="font-medium">{item.ratePeriod.name}</span>
                    <span className="text-sm text-muted-foreground">
                      (£{item.ratePeriod.ratePerKwh.toFixed(3)}/kWh)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.consumption.toFixed(2)} kWh consumed
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">£{item.cost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((item.cost / costData.totalCost) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Configuration */}
      <RateConfiguration />

      {/* Tariff Comparison */}
      <TariffComparison />
    </div>
  );
}
