import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, Shield, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseEnergyConsumptionCsv, validateFile } from '@/utils/csvParser';
import { useDataStore } from '@/context/DataContext';
import { format } from 'date-fns';
import { exampleProfiles, generateExampleConsumption } from '@/utils/exampleProfiles';
import { generateSyntheticConsumption, type ConsumptionSummary } from '@/utils/urlState';

export function CsvUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [annualKwh, setAnnualKwh] = useState<string>('');
  const { setConsumptionData, fileName, dateRange } = useDataStore();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsLoading(false);
        return;
      }

      try {
        // Parse CSV
        const result = await parseEnergyConsumptionCsv(file);

        if (!result.success) {
          setError(result.error || 'Failed to parse CSV');
          setIsLoading(false);
          return;
        }

        // Store data
        if (result.data) {
          setConsumptionData(result.data, file.name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [setConsumptionData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleExampleProfile = useCallback(
    (profileId: string) => {
      const profile = exampleProfiles.find(p => p.id === profileId);
      if (!profile) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = generateExampleConsumption(profile);
        setConsumptionData(data, `Example: ${profile.name}`);
      } catch (err) {
        setError('Failed to generate example data');
      } finally {
        setIsLoading(false);
      }
    },
    [setConsumptionData]
  );

  const handleManualEntry = useCallback(() => {
    const annual = parseFloat(annualKwh);

    if (isNaN(annual) || annual <= 0) {
      setError('Please enter a valid annual consumption value');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const avgDailyConsumption = annual / 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const summary: ConsumptionSummary = {
        avgDailyConsumption,
        totalDays: 365,
        dateStart: startDate.toISOString(),
        dateEnd: endDate.toISOString(),
      };

      const data = generateSyntheticConsumption(summary);
      setConsumptionData(data, `Manual Entry: ${annual.toLocaleString()} kWh/year`);
      setAnnualKwh('');
    } catch (err) {
      setError('Failed to generate consumption data');
    } finally {
      setIsLoading(false);
    }
  }, [annualKwh, setConsumptionData]);

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">OctoView - Energy Analysis Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">What does this tool do?</h3>
            <p className="text-sm text-muted-foreground">
              OctoView analyzes your energy consumption data to help you optimize your electricity costs
              and plan renewable energy investments. It provides detailed insights on battery storage,
              solar panel systems, and combined solutions tailored to your usage patterns.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Key Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Visualize your energy consumption patterns over time</li>
              <li>Calculate costs based on time-of-use tariffs (e.g., Intelligent Octopus Go)</li>
              <li>Estimate battery storage savings and payback periods</li>
              <li>Simulate solar panel generation and financial returns</li>
              <li>Analyze combined solar + battery systems</li>
              <li>Share configurations via URL for easy comparison</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                  Privacy First - 100% Client-Side Processing
                </h3>
                <p className="text-sm text-muted-foreground">
                  All analysis happens entirely in your browser. Your energy data never leaves your device
                  and is not sent to any server. You can even use this tool offline after the initial page load.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Energy Data</CardTitle>
          <CardDescription>
            Upload your energy consumption CSV file (format: Consumption (kwh), Start, End)
          </CardDescription>
        </CardHeader>
        <CardContent>
        {/* Octopus Energy Export Instructions */}
        <div className="mb-6">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {showInstructions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            How to export data from Octopus Energy
          </button>

          {showInstructions && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4 text-sm">
              <div>
                <p className="font-medium mb-2">Step 1: Log in to your Octopus Energy account</p>
                <a
                  href="https://octopus.energy/dashboard/login/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  https://octopus.energy/dashboard/login/
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <p className="font-medium mb-2">Step 2: Navigate to My Energy</p>
                <p className="text-muted-foreground">
                  From your dashboard, click on "My Energy" in the navigation menu.
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Step 3: Download your data</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Scroll down to the "Get your energy geek on" section</li>
                  <li>Select "Electricity" from the dropdown</li>
                  <li>Choose your date range (you can go back up to 2 years)</li>
                  <li>Select "30 min" as the interval</li>
                  <li>Click "Download CSV"</li>
                </ol>
              </div>

              <div>
                <p className="font-medium mb-2">Step 4: Upload the file</p>
                <p className="text-muted-foreground">
                  Once downloaded, drag and drop the CSV file below or click to browse for it.
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">💡 Tip</p>
                <p className="text-blue-600 dark:text-blue-400">
                  For best results, download at least 1-2 months of data to get accurate battery recommendations and cost analysis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Example Profiles */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Try Example Data</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {exampleProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleExampleProfile(profile.id)}
                disabled={isLoading}
                className="p-4 text-left border rounded-lg transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-2xl mb-2">{profile.icon}</div>
                <div className="font-medium">{profile.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {profile.description}
                </div>
                <div className="text-xs text-primary mt-2">
                  ~{Math.round(profile.avgDailyConsumption * 365)} kWh/year
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Example profiles use 12 months of realistic synthetic data to demonstrate the tool
          </p>
        </div>

        {/* Manual Entry */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Or Enter Your Annual Usage</h3>
          </div>
          <div className="p-4 border rounded-lg space-y-3">
            <div className="space-y-2">
              <Label htmlFor="annual-kwh">Annual Electricity Consumption (kWh)</Label>
              <div className="flex gap-2">
                <Input
                  id="annual-kwh"
                  type="number"
                  placeholder="e.g., 3500"
                  value={annualKwh}
                  onChange={(e) => setAnnualKwh(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualEntry();
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleManualEntry}
                  disabled={isLoading || !annualKwh}
                >
                  Generate
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your total yearly electricity usage. You can find this on your annual energy statement or utility bill.
              The tool will generate 12 months of realistic consumption patterns based on this average.
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or upload your own data</span>
          </div>
        </div>

        {!fileName ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  {isLoading ? 'Processing...' : 'Drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{fileName}</p>
                {dateRange && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Data range: {format(dateRange.start, 'PPP')} to {format(dateRange.end, 'PPP')}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => document.getElementById('csv-upload-replace')?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Different File
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-upload-replace"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
