import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseEnergyConsumptionCsv, validateFile } from '@/utils/csvParser';
import { useDataStore } from '@/context/DataContext';
import { format } from 'date-fns';

export function CsvUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Upload Energy Data</CardTitle>
        <CardDescription>
          Upload your energy consumption CSV file (format: Consumption (kwh), Start, End)
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <Button asChild variant="outline" disabled={isLoading}>
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </label>
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
  );
}
