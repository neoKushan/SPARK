import { useMemo, useState, useEffect } from 'react';
import { Sun, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataStore } from '@/context/DataContext';
import {
  simulateSolar,
  getSolarPresets,
  recommendSolarSize,
} from '@/utils/solarSimulator';
import type { SolarConfig } from '@/types/consumption';
import { SolarConfigurator } from './SolarConfigurator';

export function SolarCalculator() {
  const {
    consumptionData,
    ratePeriods,
    exportRate,
    solarConfig,
    setSolarConfig,
    customSolarConfigs,
    addCustomSolar,
    updateCustomSolar,
    deleteCustomSolar,
  } = useDataStore();

  const [selectedConfig, setSelectedConfig] = useState<number>(1); // Default to Medium (4 kW)

  const presets = getSolarPresets();
  const recommendation = useMemo(
    () => recommendSolarSize(consumptionData),
    [consumptionData]
  );

  // Combine presets and custom configs for selection
  const allConfigs: (SolarConfig | null)[] = useMemo(() => {
    const presetsWithIds = presets.map((preset, index) => ({
      ...preset,
      id: `preset-${index}`,
    }));
    return [null, ...presetsWithIds, ...customSolarConfigs];
  }, [customSolarConfigs]);

  // Sync selectedConfig with the store's solarConfig
  useEffect(() => {
    if (solarConfig !== undefined) {
      // Find the index of the current config in allConfigs
      const index = allConfigs.findIndex((config) => {
        if (config === null && solarConfig === null) return true;
        if (config === null || solarConfig === null) return false;
        return config.id === solarConfig.id ||
               (config.capacity === solarConfig.capacity &&
                config.orientation === solarConfig.orientation &&
                config.tilt === solarConfig.tilt);
      });
      if (index !== -1 && index !== selectedConfig) {
        setSelectedConfig(index);
      }
    }
  }, [solarConfig]);

  // Use current solar config or selected config
  const currentConfig: SolarConfig | null = solarConfig !== undefined ? solarConfig : allConfigs[selectedConfig];

  // Solar-only analysis
  const analysis = useMemo(() => {
    if (consumptionData.length === 0 || !currentConfig) return null;
    return simulateSolar(consumptionData, currentConfig, ratePeriods, exportRate);
  }, [consumptionData, currentConfig, ratePeriods, exportRate]);

  const handleConfigSelect = (index: number) => {
    setSelectedConfig(index);
    setSolarConfig(allConfigs[index]);
  };

  if (consumptionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solar Calculator</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendation */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" />
            Recommended Solar System Size
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{recommendation.recommendedCapacity} kW</div>
          <p className="text-muted-foreground">{recommendation.reasoning}</p>
        </CardContent>
      </Card>

      {/* Solar System Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Solar System</CardTitle>
          <CardDescription>Choose from preset and custom solar panel configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {allConfigs.map((config, index) => (
              <button
                key={config?.id || index}
                onClick={() => handleConfigSelect(index)}
                className={`p-4 text-left border rounded-lg transition-all ${
                  selectedConfig === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {config === null ? (
                  <>
                    <div className="font-bold text-lg">None</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      No solar - compare grid-only scenario
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-lg">{config.name}</div>
                    {config.description && (
                      <div className="text-sm text-muted-foreground mt-1">{config.description}</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        {config.panelEfficiency}% efficiency • {config.orientation} facing
                      </div>
                      {config.cost && (
                        <div className="text-sm font-semibold text-primary">
                          £{config.cost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Solar Configurator */}
      <SolarConfigurator
        configs={customSolarConfigs}
        onAdd={addCustomSolar}
        onUpdate={updateCustomSolar}
        onDelete={deleteCustomSolar}
      />

      {/* Savings Analysis */}
      {analysis && currentConfig && (
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
                    : 'Based on £1200/kW estimate'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Self-Consumption</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.selfConsumptionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Of generation used on-site
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Generation</CardTitle>
                <Sun className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analysis.totalGeneration / consumptionData.length * 48 * 365).toFixed(0)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  Estimated annual generation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Energy Breakdown</CardTitle>
                <CardDescription>How your solar energy is used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Self-Consumed</span>
                    <span className="font-bold">
                      {analysis.totalSelfConsumed.toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exported to Grid</span>
                    <span className="font-bold">
                      {analysis.totalExported.toFixed(2)} kWh
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
                <CardDescription>How you save money with solar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Import Savings</span>
                    <span className="font-bold text-green-600">
                      £{analysis.importSavings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Export Earnings</span>
                    <span className="font-bold text-green-600">
                      £{analysis.exportEarnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-medium">Total Savings</span>
                    <span className="font-bold text-lg text-green-600">
                      £{analysis.totalSavings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Information Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Note:</strong> Solar generation estimates are based on UK average irradiance
                  patterns. Actual generation may vary based on location, weather, and shading.
                </p>
                <p>
                  Export rate: {(exportRate * 100).toFixed(1)}p/kWh
                  (configured in Pricing tab)
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
