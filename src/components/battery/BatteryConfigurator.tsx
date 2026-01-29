import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BatteryConfig } from '@/types/consumption';

interface BatteryConfiguratorProps {
  configs: BatteryConfig[];
  onAdd: (config: BatteryConfig) => void;
  onUpdate: (id: string, config: Partial<BatteryConfig>) => void;
  onDelete: (id: string) => void;
}

export function BatteryConfigurator({ configs, onAdd, onUpdate, onDelete }: BatteryConfiguratorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BatteryConfig>>({});

  const startEdit = (config: BatteryConfig) => {
    setEditingId(config.id!);
    setEditForm({
      name: config.name,
      capacity: config.capacity,
      chargeRate: config.chargeRate,
      dischargeRate: config.dischargeRate,
      roundtripEfficiency: config.roundtripEfficiency,
      cost: config.cost,
    });
  };

  const saveEdit = (id: string) => {
    onUpdate(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddNew = () => {
    const newConfig: BatteryConfig = {
      id: `battery-${Date.now()}`,
      name: 'Custom Battery',
      capacity: 10,
      chargeRate: 5,
      dischargeRate: 5,
      roundtripEfficiency: 90,
      cost: 6000,
      minimumSoc: 10,
      maximumSoc: 100,
    };
    onAdd(newConfig);
    startEdit(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Battery Configurations</CardTitle>
            <CardDescription>Add and compare your own battery options</CardDescription>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Battery
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              {editingId === config.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Battery Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Capacity (kWh)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.capacity || ''}
                        onChange={(e) => setEditForm({ ...editForm, capacity: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Charge Rate (kW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.chargeRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, chargeRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Discharge Rate (kW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.dischargeRate || ''}
                        onChange={(e) => setEditForm({ ...editForm, dischargeRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Efficiency (%)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={editForm.roundtripEfficiency || ''}
                        onChange={(e) => setEditForm({ ...editForm, roundtripEfficiency: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Cost (£)</label>
                      <input
                        type="number"
                        step="100"
                        value={editForm.cost || ''}
                        onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveEdit(config.id!)} size="sm" className="gap-2">
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
                  <div className="flex-1">
                    <div className="font-medium text-lg">{config.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {config.capacity} kWh • {config.chargeRate}kW charge • {config.roundtripEfficiency}% efficiency
                    </div>
                    {config.cost && (
                      <div className="text-sm font-medium text-primary mt-1">
                        £{config.cost.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEdit(config)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => onDelete(config.id!)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {configs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No custom batteries yet. Click "Add Battery" to create one.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
