import { useMemo, useState } from 'react';
import {
  Sun,
  Battery,
  TrendingUp,
  Calendar,
  Zap,
  DollarSign,
  Share2,
  Download,
  ArrowRight,
  Info,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/context/DataContext';
import { simulateSolarWithBattery, simulateSolar } from '@/utils/solarSimulator';
import { simulateBattery } from '@/utils/batterySimulator';
import { calculateTotalCost } from '@/utils/pricingCalculator';
import { encodeStateToUrl, type ConsumptionSummary } from '@/utils/urlState';
import { differenceInDays, format } from 'date-fns';
import { getTariffPresets } from '@/utils/tariffPresets';

export function CombinedAnalysis() {
  const {
    consumptionData,
    ratePeriods,
    exportRate,
    solarConfig,
    batteryConfig,
    fileName,
    currentTariffId,
    customTariffName,
    customStandingCharge,
  } = useDataStore();

  const [copied, setCopied] = useState(false);
  const isSharedConfig = fileName?.includes('Shared Configuration');

  // Get current tariff details
  const currentTariff = useMemo(() => {
    if (currentTariffId === null) {
      return {
        provider: 'Custom',
        name: customTariffName,
        standingCharge: customStandingCharge,
      };
    }
    const tariffPresets = getTariffPresets();
    const tariff = tariffPresets.find((t) => t.id === currentTariffId);
    return tariff ? { provider: tariff.provider, name: tariff.name, standingCharge: tariff.standingCharge } : null;
  }, [currentTariffId, customTariffName, customStandingCharge]);

  // Calculate consumption summary for display
  const consumptionSummary = useMemo(() => {
    if (consumptionData.length === 0) return null;
    const firstPoint = consumptionData[0];
    const lastPoint = consumptionData[consumptionData.length - 1];
    const totalDays = Math.max(1, differenceInDays(lastPoint.end, firstPoint.start));
    const totalConsumption = consumptionData.reduce((sum, point) => sum + point.consumption, 0);
    const avgDailyConsumption = totalConsumption / totalDays;
    const annualConsumption = avgDailyConsumption * 365;

    return {
      avgDailyConsumption,
      annualConsumption,
      totalDays,
      totalConsumption,
      dateStart: firstPoint.start,
      dateEnd: lastPoint.end,
    };
  }, [consumptionData]);

  // Calculate baseline costs (no solar/battery)
  const baselineCost = useMemo(() => {
    if (consumptionData.length === 0) return 0;
    return calculateTotalCost(consumptionData, ratePeriods);
  }, [consumptionData, ratePeriods]);

  // Calculate analysis based on what's configured
  const analysis = useMemo(() => {
    if (consumptionData.length === 0) return null;

    // Combined analysis (both solar and battery)
    if (solarConfig && batteryConfig) {
      return {
        type: 'combined' as const,
        ...simulateSolarWithBattery(consumptionData, solarConfig, batteryConfig, ratePeriods, exportRate)
      };
    }

    // Battery only analysis
    if (batteryConfig && !solarConfig) {
      return {
        type: 'battery' as const,
        ...simulateBattery(consumptionData, batteryConfig, ratePeriods)
      };
    }

    // Solar only analysis
    if (solarConfig && !batteryConfig) {
      return {
        type: 'solar' as const,
        ...simulateSolar(consumptionData, solarConfig, ratePeriods, exportRate)
      };
    }

    // No system configured
    return null;
  }, [consumptionData, solarConfig, batteryConfig, ratePeriods, exportRate]);

  const handleShare = () => {
    // Prepare consumption summary for URL encoding
    let urlConsumptionSummary: ConsumptionSummary | undefined;
    if (consumptionSummary) {
      urlConsumptionSummary = {
        avgDailyConsumption: consumptionSummary.avgDailyConsumption,
        totalDays: consumptionSummary.totalDays,
        dateStart: consumptionSummary.dateStart.toISOString(),
        dateEnd: consumptionSummary.dateEnd.toISOString(),
      };
    }

    const queryString = encodeStateToUrl({
      ratePeriods,
      batteryConfig: batteryConfig || undefined,
      solarConfig: solarConfig || undefined,
      consumptionSummary: urlConsumptionSummary,
    });

    const shareUrl = `${window.location.origin}${window.location.pathname}?${queryString}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    // Create a printable version
    window.print();
  };

  if (consumptionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Combined Solar + Battery Analysis</CardTitle>
          <CardDescription>Upload consumption data to see analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate system cost based on what's configured
  const totalSystemCost = useMemo(() => {
    let cost = 0;
    if (solarConfig) cost += (solarConfig.cost || solarConfig.capacity * 1200);
    if (batteryConfig) cost += (batteryConfig.cost || batteryConfig.capacity * 500);
    return cost;
  }, [solarConfig, batteryConfig]);

  const annualBaselineCost = baselineCost * (365 / (consumptionData.length / 48));
  const netAnnualCost = analysis ? annualBaselineCost - analysis.annualEstimate : annualBaselineCost;
  const totalSavingsPercent = analysis ? (analysis.annualEstimate / annualBaselineCost) * 100 : 0;

  // Determine system title based on configuration
  const systemTitle = useMemo(() => {
    if (solarConfig && batteryConfig) return 'Solar + Battery System';
    if (batteryConfig) return 'Battery System';
    if (solarConfig) return 'Solar System';
    return 'Grid-Only (No System)';
  }, [solarConfig, batteryConfig]);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">System Summary</h2>
          <p className="text-muted-foreground mt-1">
            Complete analysis of your solar + battery system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Shared Configuration Warning */}
      {isSharedConfig && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Viewing Shared Configuration
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  This analysis uses synthetic consumption data based on shared average usage patterns.
                  Results are estimates. Upload your own CSV data for accurate personalized analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consumption Summary - Always visible */}
      {consumptionSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Consumption Overview</CardTitle>
            <CardDescription>Summary of your electricity usage data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Annual Usage</div>
                <div className="text-2xl font-bold">
                  {consumptionSummary.annualConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Daily Average</div>
                <div className="text-2xl font-bold">
                  {consumptionSummary.avgDailyConsumption.toFixed(1)} kWh
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data Period</div>
                <div className="text-2xl font-bold">
                  {consumptionSummary.totalDays} days
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date Range</div>
                <div className="text-lg font-bold">
                  {format(consumptionSummary.dateStart, 'MMM yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  to {format(consumptionSummary.dateEnd, 'MMM yyyy')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Configuration Summary */}
      {(solarConfig || batteryConfig) && (
        <div className="grid gap-4 md:grid-cols-2">
          {solarConfig && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  Solar Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{solarConfig.capacity} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orientation:</span>
                  <span className="font-medium capitalize">{solarConfig.orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tilt:</span>
                  <span className="font-medium">{solarConfig.tilt}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">£{(solarConfig.cost || solarConfig.capacity * 1200).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {batteryConfig && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-blue-500" />
                  Battery Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{batteryConfig.capacity} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charge Rate:</span>
                  <span className="font-medium">{batteryConfig.chargeRate} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efficiency:</span>
                  <span className="font-medium">{batteryConfig.roundtripEfficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">£{(batteryConfig.cost || batteryConfig.capacity * 500).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No System Configured Message */}
      {!solarConfig && !batteryConfig && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-500" />
              No System Configured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              You're viewing grid-only costs. Configure a solar or battery system to see potential savings.
            </p>
            <div className="space-y-2 text-sm">
              <p>• Go to the <strong>Solar</strong> tab to configure solar panels</p>
              <p>• Go to the <strong>Battery</strong> tab to configure battery storage</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(solarConfig || batteryConfig) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total System Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalSystemCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {systemTitle}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {analysis ? 'Annual Savings' : 'Annual Cost'}
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${analysis ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analysis ? 'text-green-600' : 'text-red-600'}`}>
              {analysis ? `£${analysis.annualEstimate.toFixed(2)}` : `£${annualBaselineCost.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis ? `${totalSavingsPercent.toFixed(0)}% reduction vs grid-only` : 'Grid-only costs'}
            </p>
          </CardContent>
        </Card>

        {analysis && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.paybackPeriod < 100 ? `${analysis.paybackPeriod.toFixed(1)} years` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Break-even point
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {analysis.type === 'combined' ? 'Self-Sufficiency' : 'Self-Consumption'}
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.type === 'combined'
                    ? analysis.selfSufficiencyRate?.toFixed(1)
                    : analysis.selfConsumptionRate?.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.type === 'combined'
                    ? 'Met by solar + battery'
                    : analysis.type === 'solar'
                    ? 'Solar energy used on-site'
                    : 'Consumption from battery'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Financial Comparison */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Annual Cost Comparison</CardTitle>
            <CardDescription>Baseline vs {systemTitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div>
                  <div className="font-medium">Grid Only (Current)</div>
                  <div className="text-sm text-muted-foreground">No solar or battery</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">£{annualBaselineCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div>
                  <div className="font-medium">With {systemTitle}</div>
                  <div className="text-sm text-muted-foreground">After system savings</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">£{netAnnualCost.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">per year</div>
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">Annual Savings</div>
                <div className="text-3xl font-bold text-primary">£{analysis.annualEstimate.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Energy Flow Breakdown */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Energy Flow</CardTitle>
              <CardDescription>How energy moves through your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analysis.type === 'combined' || analysis.type === 'solar') && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Sun className="w-4 h-4 text-yellow-500" />
                        Solar Generated
                      </span>
                      <span className="font-bold">{analysis.totalGeneration?.toFixed(2)} kWh</span>
                    </div>
                    <div className="pl-6 space-y-2 border-l-2 border-muted ml-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">→ Self-Consumed</span>
                        <span className="font-medium">{analysis.totalSelfConsumed?.toFixed(2)} kWh</span>
                      </div>
                      {analysis.type === 'combined' && analysis.totalBatteryCharged !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Battery className="w-3 h-3" />
                            → Battery Charged
                          </span>
                          <span className="font-medium">{analysis.totalBatteryCharged.toFixed(2)} kWh</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">→ Exported</span>
                        <span className="font-medium">{analysis.totalExported?.toFixed(2)} kWh</span>
                      </div>
                    </div>
                  </>
                )}
                {(analysis.type === 'combined' || analysis.type === 'battery') && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm flex items-center gap-2">
                      <Battery className="w-4 h-4 text-blue-500" />
                      Battery Discharged
                    </span>
                    <span className="font-bold">
                      {analysis.type === 'combined' && analysis.totalBatteryDischarged !== undefined
                        ? analysis.totalBatteryDischarged.toFixed(2)
                        : analysis.type === 'battery' && analysis.states
                        ? analysis.states
                            .filter((s) => s.action === 'discharging')
                            .reduce((sum, s) => sum + Math.abs(s.powerFlow) * 0.5, 0)
                            .toFixed(2)
                        : '0.00'} kWh
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
              <CardDescription>Where your savings come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Import Savings</span>
                  <span className="font-bold text-green-600">
                    £{(analysis.type === 'battery'
                      ? analysis.totalSavings
                      : analysis.importSavings
                    )?.toFixed(2)}
                  </span>
                </div>
                {(analysis.type === 'combined' || analysis.type === 'solar') && analysis.exportEarnings !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Export Earnings</span>
                    <span className="font-bold text-green-600">£{analysis.exportEarnings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-medium">Total Savings</span>
                  <span className="font-bold text-lg text-green-600">
                    £{analysis.totalSavings?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm">
                  <span className="text-muted-foreground">Daily Average</span>
                  <span className="font-medium">£{analysis.dailyAverageSavings?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rates Information */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="w-4 h-4" />
            Rate Configuration
          </CardTitle>
          {currentTariff && (
            <CardDescription>
              {currentTariff.provider} - {currentTariff.name}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            {ratePeriods.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: rate.color || '#3b82f6' }}
                  />
                  {rate.name}
                </span>
                <span className="font-medium">{(rate.ratePerKwh * 100).toFixed(2)}p/kWh</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {currentTariff?.standingCharge !== undefined && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Standing Charge:</span>
                <span className="font-medium">{currentTariff.standingCharge.toFixed(1)}p/day</span>
              </div>
            )}
            {solarConfig && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Export Rate:</span>
                <span className="font-medium">{(exportRate * 100).toFixed(1)}p/kWh</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      {analysis && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p className="font-medium">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Analysis based on {consumptionData.length / 48} days of consumption data</li>
                {(analysis.type === 'combined' || analysis.type === 'solar') && (
                  <>
                    <li>Solar generation estimates use UK average irradiance patterns</li>
                    <li>Actual results may vary based on location, weather, and shading</li>
                    <li>Export rate: {(exportRate * 100).toFixed(1)}p/kWh (configured in Pricing tab)</li>
                  </>
                )}
                {(analysis.type === 'combined' || analysis.type === 'battery') && (
                  <li>Battery simulation assumes optimal charging/discharging strategy</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
