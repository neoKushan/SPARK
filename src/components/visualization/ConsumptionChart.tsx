import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConsumptionDataPoint, TimeFrame, RatePeriod } from '@/types/consumption';
import { matchRatePeriod } from '@/utils/pricingCalculator';

interface ConsumptionChartProps {
  data: ConsumptionDataPoint[];
  timeFrame?: TimeFrame;
  title?: string;
  showArea?: boolean;
  viewMode?: 'kwh' | 'cost';
  ratePeriods?: RatePeriod[];
}

export function ConsumptionChart({
  data,
  timeFrame = 'day',
  title = 'Energy Consumption',
  showArea = true,
  viewMode = 'kwh',
  ratePeriods = [],
}: ConsumptionChartProps) {
  const [brushStart, setBrushStart] = useState<number | undefined>(undefined);
  const [brushEnd, setBrushEnd] = useState<number | undefined>(undefined);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((point) => {
      const consumption = Number(point.consumption.toFixed(3));
      let cost = 0;

      if (viewMode === 'cost' && ratePeriods.length > 0) {
        const rate = matchRatePeriod(point.start, ratePeriods);
        cost = Number((consumption * rate.ratePerKwh).toFixed(4));
      }

      return {
        timestamp: point.start.getTime(),
        consumption,
        cost,
        value: viewMode === 'cost' ? cost : consumption,
        date: point.start,
      };
    });
  }, [data, viewMode, ratePeriods]);

  // Format x-axis based on time frame
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (timeFrame) {
      case 'all':
        return format(date, 'MMM dd HH:mm');
      case 'day':
        return format(date, 'MMM dd');
      case 'week':
        return format(date, 'MMM dd');
      case 'month':
        return format(date, 'MMM yyyy');
      case 'year':
        return format(date, 'MMM yyyy');
      default:
        return format(date, 'MMM dd');
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">
            {format(data.date, 'PPpp')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {viewMode === 'kwh' ? (
              <span className="text-primary font-semibold">{data.consumption} kWh</span>
            ) : (
              <>
                <span className="text-primary font-semibold">£{data.cost.toFixed(2)}</span>
                <span className="text-xs ml-2">({data.consumption} kWh)</span>
              </>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    if (viewMode === 'cost' && ratePeriods.length > 0) {
      const costs = data.map((point) => {
        const rate = matchRatePeriod(point.start, ratePeriods);
        return point.consumption * rate.ratePerKwh;
      });
      const total = costs.reduce((sum, cost) => sum + cost, 0);
      const average = total / costs.length;
      const max = Math.max(...costs);
      const min = Math.min(...costs);

      return {
        total: `£${total.toFixed(2)}`,
        average: `£${average.toFixed(4)}`,
        max: `£${max.toFixed(4)}`,
        min: `£${min.toFixed(4)}`,
        unit: '£',
      };
    } else {
      const total = data.reduce((sum, point) => sum + point.consumption, 0);
      const average = total / data.length;
      const max = Math.max(...data.map((point) => point.consumption));
      const min = Math.min(...data.map((point) => point.consumption));

      return {
        total: `${total.toFixed(2)} kWh`,
        average: `${average.toFixed(3)} kWh`,
        max: `${max.toFixed(3)} kWh`,
        min: `${min.toFixed(3)} kWh`,
        unit: 'kWh',
      };
    }
  }, [data, viewMode, ratePeriods]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {stats && (
            <div className="flex flex-wrap gap-4 mt-2">
              <span>Total: <strong>{stats.total}</strong></span>
              <span>Average: <strong>{stats.average}</strong></span>
              <span>Peak: <strong>{stats.max}</strong></span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-2">
          {data.length > 50 ? 'Drag the slider below to zoom into specific time periods' : ''}
        </div>
        <ResponsiveContainer width="100%" height={450}>
          {showArea ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                domain={brushStart && brushEnd ? [brushStart, brushEnd] : ['auto', 'auto']}
              />
              <YAxis
                label={{ value: viewMode === 'kwh' ? 'kWh' : '£', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                name={viewMode === 'kwh' ? 'Consumption (kWh)' : 'Cost (£)'}
                strokeWidth={2}
              />
              {data.length > 50 && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                  tickFormatter={formatXAxis}
                  onChange={(e) => {
                    if (e.startIndex !== undefined && e.endIndex !== undefined) {
                      setBrushStart(chartData[e.startIndex]?.timestamp);
                      setBrushEnd(chartData[e.endIndex]?.timestamp);
                    }
                  }}
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
                domain={brushStart && brushEnd ? [brushStart, brushEnd] : ['auto', 'auto']}
              />
              <YAxis
                label={{ value: viewMode === 'kwh' ? 'kWh' : '£', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                name={viewMode === 'kwh' ? 'Consumption (kWh)' : 'Cost (£)'}
                strokeWidth={2}
                dot={data.length <= 100}
              />
              {data.length > 50 && (
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--muted))"
                  tickFormatter={formatXAxis}
                  onChange={(e) => {
                    if (e.startIndex !== undefined && e.endIndex !== undefined) {
                      setBrushStart(chartData[e.startIndex]?.timestamp);
                      setBrushEnd(chartData[e.endIndex]?.timestamp);
                    }
                  }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
