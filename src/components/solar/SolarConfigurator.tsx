import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SolarConfig } from '@/types/consumption';

interface SolarConfiguratorProps {
  configs: SolarConfig[];
  onAdd: (config: SolarConfig) => void;
  onUpdate: (id: string, config: Partial<SolarConfig>) => void;
  onDelete: (id: string) => void;
}

export function SolarConfigurator({ configs, onAdd, onUpdate, onDelete }: SolarConfiguratorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SolarConfig>>({});

  const startEdit = (config: SolarConfig) => {
    setEditingId(config.id!);
    setEditForm({
      name: config.name,
      capacity: config.capacity,
      panelEfficiency: config.panelEfficiency,
      systemEfficiency: config.systemEfficiency,
      orientation: config.orientation,
      tilt: config.tilt,
      cost: config.cost,
      predictedAnnualOutput: config.predictedAnnualOutput,
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
    const newConfig: SolarConfig = {
      id: `solar-${Date.now()}`,
      name: 'Custom Solar System',
      capacity: 4.0,
      panelEfficiency: 20,
      systemEfficiency: 85,
      orientation: 'south',
      tilt: 35,
      cost: 4800,
    };
    onAdd(newConfig);
    startEdit(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Custom Solar Configurations</CardTitle>
            <CardDescription>Add and compare your own solar panel options</CardDescription>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Solar System
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
                      <label className="text-sm font-medium mb-1 block">System Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Capacity (kW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.capacity || ''}
                        onChange={(e) => setEditForm({ ...editForm, capacity: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Panel Efficiency (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.panelEfficiency || ''}
                        onChange={(e) => setEditForm({ ...editForm, panelEfficiency: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">System Efficiency (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.systemEfficiency || ''}
                        onChange={(e) => setEditForm({ ...editForm, systemEfficiency: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Orientation</label>
                      <select
                        value={editForm.orientation || 'south'}
                        onChange={(e) => setEditForm({ ...editForm, orientation: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      >
                        <option value="south">South</option>
                        <option value="south-east">South-East</option>
                        <option value="south-west">South-West</option>
                        <option value="east">East</option>
                        <option value="west">West</option>
                        <option value="north">North</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tilt Angle (°)</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="90"
                        value={editForm.tilt || ''}
                        onChange={(e) => setEditForm({ ...editForm, tilt: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">System Cost (£)</label>
                      <input
                        type="number"
                        step="100"
                        value={editForm.cost || ''}
                        onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">
                        Predicted Annual Output (kWh/year)
                        <span className="text-muted-foreground font-normal ml-2">
                          (Optional - overrides calculated values)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="100"
                        value={editForm.predictedAnnualOutput || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          predictedAnnualOutput: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        placeholder="Leave empty to calculate from system parameters"
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
                      {config.capacity} kW • {config.orientation} facing • {config.tilt}° tilt
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {config.panelEfficiency}% panel efficiency • {config.systemEfficiency}% system efficiency
                    </div>
                    {config.predictedAnnualOutput && (
                      <div className="text-sm font-medium text-accent-foreground mt-1">
                        Predicted: {config.predictedAnnualOutput.toLocaleString()} kWh/year
                      </div>
                    )}
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
              No custom solar systems yet. Click "Add Solar System" to create one.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
