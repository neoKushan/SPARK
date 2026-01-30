import { useMemo, useState } from 'react';
import { Calendar, TrendingUp, BarChart3, DollarSign, Battery, Sun, Layers, Github } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ConsumptionChart } from './ConsumptionChart';
import { PricingOverview } from '../pricing/PricingOverview';
import { BatteryCalculator } from '../battery/BatteryCalculator';
import { SolarCalculator } from '../solar/SolarCalculator';
import { CombinedAnalysis } from '../combined/CombinedAnalysis';
import { useDataStore } from '@/context/DataContext';
import { aggregateByTimeFrame, calculateStatistics } from '@/utils/aggregationUtils';
import { format } from 'date-fns';
import type { TimeFrame } from '@/types/consumption';
import { trackTabSwitch } from '@/utils/analytics';
import { PrivacyPolicy } from '@/components/privacy/PrivacyPolicy';

export function Dashboard() {
  const { consumptionData, selectedTimeFrame, setSelectedTimeFrame, dateRange, ratePeriods, fileName } = useDataStore();

  // Detect if using shared configuration data (not example profiles)
  const isSharedConfig = fileName?.includes('Shared Configuration');

  // Set initial tab - shared configs go to summary, everything else to consumption
  const [activeTab, setActiveTab] = useState(isSharedConfig ? 'summary' : 'consumption');
  const [viewMode, setViewMode] = useState<'kwh' | 'cost'>('kwh');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackTabSwitch(tab);
  };

  // Calculate statistics
  const stats = useMemo(() => calculateStatistics(consumptionData), [consumptionData]);

  // Aggregate data based on selected time frame
  const aggregatedData = useMemo(
    () => aggregateByTimeFrame(consumptionData, selectedTimeFrame),
    [consumptionData, selectedTimeFrame]
  );

  // Convert aggregated data to chart format
  const chartData = useMemo(() => {
    if (selectedTimeFrame === 'all') {
      return consumptionData;
    }

    // For aggregated views, create synthetic data points for the chart
    return aggregatedData.map((agg) => ({
      consumption: agg.totalConsumption,
      start: agg.peakTime, // Use peak time as the timestamp for positioning
      end: agg.peakTime,
    }));
  }, [consumptionData, aggregatedData, selectedTimeFrame]);

  const timeFrames: { value: TimeFrame; label: string }[] = [
    { value: 'all', label: 'Raw Data' },
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Energy Dashboard</h2>
        {dateRange && (
          <p className="text-muted-foreground mt-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="consumption" className="gap-2 flex-shrink-0" disabled={isSharedConfig}>
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Consumption</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 flex-shrink-0" disabled={isSharedConfig}>
              <DollarSign className="w-4 h-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="battery" className="gap-2 flex-shrink-0" disabled={isSharedConfig}>
              <Battery className="w-4 h-4" />
              <span>Battery</span>
            </TabsTrigger>
            <TabsTrigger value="solar" className="gap-2 flex-shrink-0" disabled={isSharedConfig}>
              <Sun className="w-4 h-4" />
              <span>Solar</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2 flex-shrink-0">
              <Layers className="w-4 h-4" />
              <span>Summary</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Consumption Tab */}
        <TabsContent value="consumption" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-xl font-semibold">Energy Consumption Analysis</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'kwh' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kwh')}
                >
                  kWh
                </Button>
                <Button
                  variant={viewMode === 'cost' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cost')}
                >
                  Cost (£)
                </Button>
              </div>
              <div className="flex gap-2">
                {timeFrames.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={selectedTimeFrame === tf.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeFrame(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConsumption.toFixed(2)} kWh</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.dataPoints} data points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageConsumption.toFixed(3)} kWh</div>
                  <p className="text-xs text-muted-foreground">
                    Per 30-minute interval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peak Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.maxConsumption.toFixed(3)} kWh</div>
                  <p className="text-xs text-muted-foreground">
                    Maximum in a single period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Minimum Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.minConsumption.toFixed(3)} kWh</div>
                  <p className="text-xs text-muted-foreground">
                    Lowest recorded period
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Chart */}
          <ConsumptionChart
            data={chartData}
            timeFrame={selectedTimeFrame}
            title={`${viewMode === 'kwh' ? 'Energy Consumption' : 'Energy Cost'} - ${timeFrames.find((t) => t.value === selectedTimeFrame)?.label}`}
            showArea={true}
            viewMode={viewMode}
            ratePeriods={ratePeriods}
          />

          {/* Aggregated Data Table */}
          {aggregatedData.length > 0 && selectedTimeFrame !== 'all' && (
            <Accordion type="single" collapsible>
              <AccordionItem value="breakdown">
                <Card>
                  <CardHeader>
                    <AccordionTrigger className="hover:no-underline [&[data-state=open]>div]:mb-0">
                      <div className="mb-2">
                        <CardTitle>
                          {timeFrames.find((t) => t.value === selectedTimeFrame)?.label} Breakdown
                        </CardTitle>
                        <CardDescription>
                          Consumption aggregated by {selectedTimeFrame}
                        </CardDescription>
                      </div>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent>
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                              <th className="h-12 px-4 text-left align-middle font-medium">Period</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Total (kWh)</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Average (kWh)</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Peak (kWh)</th>
                              <th className="h-12 px-4 text-left align-middle font-medium">Peak Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aggregatedData.map((row, index) => (
                              <tr
                                key={index}
                                className="border-b transition-colors hover:bg-muted/50"
                              >
                                <td className="p-4 align-middle">{row.period}</td>
                                <td className="p-4 align-middle">{row.totalConsumption.toFixed(2)}</td>
                                <td className="p-4 align-middle">{row.averageConsumption.toFixed(3)}</td>
                                <td className="p-4 align-middle">{row.peakConsumption.toFixed(3)}</td>
                                <td className="p-4 align-middle">
                                  {format(row.peakTime, 'MMM dd, HH:mm')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
          )}
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <PricingOverview />
        </TabsContent>

        {/* Battery Tab */}
        <TabsContent value="battery">
          <BatteryCalculator />
        </TabsContent>

        {/* Solar Tab */}
        <TabsContent value="solar">
          <SolarCalculator />
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <CombinedAnalysis />
        </TabsContent>
      </Tabs>

      {/* Footer Links */}
      <div className="flex justify-center items-center gap-4 pt-6">
        <a
          href="https://github.com/neoKushan/SPARK"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Github className="w-4 h-4" />
          View on GitHub
        </a>
        <span className="text-muted-foreground">•</span>
        <PrivacyPolicy />
      </div>
    </div>
  );
}
