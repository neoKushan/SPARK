import { useMemo, useState } from 'react';
import { Battery, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataStore } from '@/context/DataContext';
import { simulateBattery, getBatteryPresets, recommendBatterySize } from '@/utils/batterySimulator';
import { format } from 'date-fns';
import type { BatteryConfig } from '@/types/consumption';
import { BatteryConfigurator } from './BatteryConfigurator';
import { BatteryComparison } from './BatteryComparison';

export function BatteryCalculator() {
  const {
    consumptionData,
    ratePeriods,
    batteryConfig,
    setBatteryConfig,
    customBatteryConfigs,
    addCustomBattery,
    updateCustomBattery,
    deleteCustomBattery,
  } = useDataStore();

  const [selectedPreset, setSelectedPreset] = useState<number>(1); // Default to Medium (10 kWh)
  const [activeTab, setActiveTab] = useState('analysis');

  const presets = getBatteryPresets();
  const recommendation = useMemo(
    () => recommendBatterySize(consumptionData, ratePeriods),
    [consumptionData, ratePeriods]
  );

  // Use current battery config or selected preset
  const currentConfig: BatteryConfig = batteryConfig || presets[selectedPreset];

  const analysis = useMemo(() => {
    if (consumptionData.length === 0) return null;
    return simulateBattery(consumptionData, currentConfig, ratePeriods);
  }, [consumptionData, currentConfig, ratePeriods]);

  const handlePresetSelect = (index: number) => {
    setSelectedPreset(index);
    setBatteryConfig({
      ...presets[index],
      minimumSoc: 10,
      maximumSoc: 100,
    });
  };

  // Combine presets and custom configs for comparison
  const allConfigs: BatteryConfig[] = useMemo(() => {
    const presetsWithIds = presets.map((preset, index) => ({
      ...preset,
      id: `preset-${index}`,
      minimumSoc: 10,
      maximumSoc: 100,
    }));
    return [...presetsWithIds, ...customBatteryConfigs];
  }, [presets, customBatteryConfigs]);

  if (consumptionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Battery Calculator</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="custom">Custom Batteries</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Recommendation */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Recommended Battery Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{recommendation.recommendedCapacity} kWh</div>
              <p className="text-muted-foreground">{recommendation.reasoning}</p>
            </CardContent>
          </Card>

          {/* Battery Size Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Battery Size</CardTitle>
              <CardDescription>Choose from common battery configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(index)}
                    className={`p-4 text-left border rounded-lg transition-all ${
                      selectedPreset === index
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold text-lg">{preset.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">{preset.description}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        {preset.chargeRate}kW charge • {preset.roundtripEfficiency}% efficiency
                      </div>
                      {preset.cost && (
                        <div className="text-sm font-semibold text-primary">
                          £{preset.cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Savings Analysis */}
          {analysis && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      £{analysis.annualEstimate.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      £{analysis.dailyAverageSavings.toFixed(2)}/day average
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analysis.paybackPeriod < 100
                        ? `${analysis.paybackPeriod.toFixed(1)} years`
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentConfig.cost
                        ? `Based on £${currentConfig.cost.toLocaleString()} cost`
                        : 'Based on £500/kWh estimate'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Self-Sufficiency</CardTitle>
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analysis.selfConsumptionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Of consumption from battery
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Peak Shaving</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analysis.peakShavingBenefit.toFixed(2)} kWh
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Peak demand reduction
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Winter Coverage */}
              <Card>
                <CardHeader>
                  <CardTitle>Winter Coverage Analysis</CardTitle>
                  <CardDescription>
                    Battery performance during high-demand periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Average Daily Coverage
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {analysis.winterCoverage.averageDailyCoverage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Minimum Coverage
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {analysis.winterCoverage.minimumCoverage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Worst Day
                      </div>
                      <div className="text-lg font-bold mt-1">
                        {format(analysis.winterCoverage.worstDay, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Savings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Savings Breakdown by Rate Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(analysis.savingsByRate.entries()).map(([rateId, savings]) => {
                      const period = ratePeriods.find((p) => p.id === rateId);
                      if (!period) return null;

                      return (
                        <div key={rateId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: period.color || '#3b82f6' }}
                            />
                            <span className="font-medium">{period.name}</span>
                          </div>
                          <span className={`font-bold ${savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {savings >= 0 ? '+' : ''}£{savings.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-6">
          <BatteryComparison
            configs={allConfigs}
            consumptionData={consumptionData}
            ratePeriods={ratePeriods}
            onSelectConfig={(config) => {
              setBatteryConfig(config);
              setActiveTab('analysis');
            }}
          />
        </TabsContent>

        {/* Custom Batteries Tab */}
        <TabsContent value="custom" className="space-y-6">
          <BatteryConfigurator
            configs={customBatteryConfigs}
            onAdd={addCustomBattery}
            onUpdate={updateCustomBattery}
            onDelete={deleteCustomBattery}
          />

          {customBatteryConfigs.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={() => setActiveTab('compare')}
                variant="outline"
                className="gap-2"
              >
                <Battery className="w-4 h-4" />
                Compare All Batteries
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
