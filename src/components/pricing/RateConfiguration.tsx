import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/context/DataContext';
import { getTariffPresets } from '@/utils/tariffPresets';
import { trackTariffChange } from '@/utils/analytics';
import type { RatePeriod } from '@/types/consumption';

export function RateConfiguration() {
  const {
    ratePeriods,
    currentTariffId,
    exportRate,
    customTariffName,
    customStandingCharge,
    updateRatePeriod,
    deleteRatePeriod,
    addRatePeriod,
    setTariff,
    setCustomTariff,
    setExportRate,
    setCustomTariffName,
    setCustomStandingCharge,
  } = useDataStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RatePeriod>>({});

  const tariffPresets = getTariffPresets();
  const currentTariff = tariffPresets.find((t) => t.id === currentTariffId);

  const startEdit = (period: RatePeriod) => {
    setEditingId(period.id);
    setEditForm({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      ratePerKwh: period.ratePerKwh,
      color: period.color,
    });
  };

  const saveEdit = (id: string) => {
    updateRatePeriod(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNew = () => {
    const newPeriod: RatePeriod = {
      id: `rate-${Date.now()}`,
      name: 'New Rate',
      startTime: '00:00',
      endTime: '00:00',
      ratePerKwh: 0.15,
      color: '#8b5cf6',
    };
    addRatePeriod(newPeriod);
    startEdit(newPeriod);
  };

  const handleTariffChange = (tariffId: string) => {
    if (tariffId === 'custom') {
      // Keep current rates but clear tariff ID to mark as custom
      setCustomTariff();
      trackTariffChange('custom');
      return;
    }
    setTariff(tariffId);
    trackTariffChange('preset');
  };

  return (
    <div className="space-y-6">
      {/* Tariff Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Energy Tariff
          </CardTitle>
          <CardDescription>Select a preset tariff or create custom rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Tariff</label>
            <select
              value={currentTariffId || 'custom'}
              onChange={(e) => handleTariffChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {tariffPresets.map((tariff) => (
                <option key={tariff.id} value={tariff.id}>
                  {tariff.provider} - {tariff.name}
                </option>
              ))}
              <option value="custom">Custom Tariff</option>
            </select>
          </div>

          {currentTariff ? (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export Rate:</span>
                <span className="font-bold">{(exportRate * 100).toFixed(1)}p/kWh</span>
              </div>
              {currentTariff.standingCharge !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Standing Charge:</span>
                  <span className="font-bold">{currentTariff.standingCharge.toFixed(1)}p/day</span>
                </div>
              )}
              {currentTariff.notes && (
                <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                  <strong>Note:</strong> {currentTariff.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1 block">Tariff Name</label>
                <input
                  type="text"
                  value={customTariffName}
                  onChange={(e) => setCustomTariffName(e.target.value)}
                  placeholder="e.g., My Energy Plan"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Standing Charge (p/day)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customStandingCharge}
                  onChange={(e) => setCustomStandingCharge(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Export Rate (£/kWh)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.001"
                value={exportRate}
                onChange={(e) => setExportRate(parseFloat(e.target.value))}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
              />
              <span className="text-sm text-muted-foreground">
                ({(exportRate * 100).toFixed(1)}p/kWh)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rate you're paid for exporting solar energy to the grid
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Rate Periods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Import Rate Periods</CardTitle>
              <CardDescription>Time-based import rates from the grid</CardDescription>
            </div>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Period
            </Button>
          </div>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          {ratePeriods.map((period) => (
            <div
              key={period.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              {editingId === period.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Rate Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Price (£/kWh)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={editForm.ratePerKwh || ''}
                        onChange={(e) => setEditForm({ ...editForm, ratePerKwh: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Start Time</label>
                      <input
                        type="time"
                        value={editForm.startTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">End Time</label>
                      <input
                        type="time"
                        value={editForm.endTime || ''}
                        onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveEdit(period.id)} size="sm" className="gap-2">
                      <Check className="w-4 h-4" />
                      Save
                    </Button>
                    <Button onClick={cancelEdit} size="sm" variant="outline" className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: period.color || '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{period.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {period.startTime} - {period.endTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">£{period.ratePerKwh.toFixed(4)}/kWh</div>
                      <div className="text-xs text-muted-foreground">{(period.ratePerKwh * 100).toFixed(2)}p/kWh</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEdit(period)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {ratePeriods.length > 1 && (
                        <Button
                          onClick={() => deleteRatePeriod(period.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <strong>Note:</strong> Cross-midnight periods (e.g., 23:30-05:30) are fully supported.
          Changes are saved automatically.
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
