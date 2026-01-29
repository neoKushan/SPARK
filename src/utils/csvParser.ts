import Papa from 'papaparse';
import { parseISO, isValid } from 'date-fns';
import type { ConsumptionDataPoint, ParseResult, RawCsvRow } from '@/types/consumption';

/**
 * Parse CSV file containing energy consumption data
 * Expected format: "Consumption (kwh), Start, End"
 */
export async function parseEnergyConsumptionCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings initially for better error handling
      transformHeader: (header) => header.trim(), // Trim whitespace from headers
      complete: (results) => {
        try {
          // Validate that we have data
          if (!results.data || results.data.length === 0) {
            resolve({
              success: false,
              error: 'CSV file is empty or contains no data rows',
            });
            return;
          }

          // Validate headers
          const firstRow = results.data[0];
          if (!('Consumption (kwh)' in firstRow) || !('Start' in firstRow) || !('End' in firstRow)) {
            resolve({
              success: false,
              error: 'CSV file must have columns: "Consumption (kwh)", "Start", and "End"',
            });
            return;
          }

          // Parse each row
          const parsedData: ConsumptionDataPoint[] = [];
          const errors: string[] = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i];
            const rowNumber = i + 2; // +2 because of header row and 1-based indexing

            try {
              const parsed = parseRow(row);
              if (parsed) {
                parsedData.push(parsed);
              }
            } catch (error) {
              errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              // Continue parsing other rows
            }
          }

          // Check if we got any valid data
          if (parsedData.length === 0) {
            resolve({
              success: false,
              error: `No valid data rows found. Errors: ${errors.join('; ')}`,
            });
            return;
          }

          // Sort by start time
          parsedData.sort((a, b) => a.start.getTime() - b.start.getTime());

          // Calculate date range
          const dateRange = {
            start: parsedData[0].start,
            end: parsedData[parsedData.length - 1].end,
          };

          // Log warnings if there were any errors but we still got some data
          if (errors.length > 0) {
            console.warn(`Parsed ${parsedData.length} rows with ${errors.length} errors:`, errors.slice(0, 5));
          }

          resolve({
            success: true,
            data: parsedData,
            rowCount: parsedData.length,
            dateRange,
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `CSV parsing error: ${error.message}`,
        });
      },
    });
  });
}

/**
 * Parse a single CSV row into a ConsumptionDataPoint
 */
function parseRow(row: RawCsvRow): ConsumptionDataPoint | null {
  // Parse consumption
  const consumptionStr = row['Consumption (kwh)'];
  if (!consumptionStr || consumptionStr.trim() === '') {
    throw new Error('Missing consumption value');
  }

  const consumption = parseFloat(consumptionStr);
  if (isNaN(consumption)) {
    throw new Error(`Invalid consumption value: "${consumptionStr}"`);
  }

  if (consumption < 0) {
    throw new Error(`Negative consumption value: ${consumption}`);
  }

  // Parse start timestamp
  const startStr = row.Start?.trim();
  if (!startStr) {
    throw new Error('Missing start timestamp');
  }

  const start = parseISO(startStr);
  if (!isValid(start)) {
    throw new Error(`Invalid start timestamp: "${startStr}"`);
  }

  // Parse end timestamp
  const endStr = row.End?.trim();
  if (!endStr) {
    throw new Error('Missing end timestamp');
  }

  const end = parseISO(endStr);
  if (!isValid(end)) {
    throw new Error(`Invalid end timestamp: "${endStr}"`);
  }

  // Validate that end is after start
  if (end <= start) {
    throw new Error(`End time (${endStr}) must be after start time (${startStr})`);
  }

  return {
    consumption,
    start,
    end,
  };
}

/**
 * Validate uploaded file before parsing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    return {
      valid: false,
      error: 'File must be a CSV file (.csv extension)',
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 50MB.`,
    };
  }

  // Check file is not empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Parse CSV from text content (useful for testing or paste functionality)
 */
export async function parseEnergyConsumptionText(csvText: string): Promise<ParseResult> {
  // Create a blob and file from the text
  const blob = new Blob([csvText], { type: 'text/csv' });
  const file = new File([blob], 'data.csv', { type: 'text/csv' });
  return parseEnergyConsumptionCsv(file);
}
