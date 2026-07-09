const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface UploadResponse {
  filename: string;
  size: number;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface ProcessResponse {
  imported: Record<string, string>[];
  skipped: { rowNumber: number; rawData: string; reason: string }[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

export interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  confidence: number;
}

export interface CSVAnalysis {
  csvType: string;
  csvTypeDescription: string;
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  missingRequiredFields: string[];
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function analyzeCSV(
  headers: string[],
  sampleRows: Record<string, string>[]
): Promise<CSVAnalysis> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, sampleRows }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function processCSVStream(
  rows: Record<string, string>[],
  onProgress: (imported: number, skipped: number, total: number) => void,
  mappings?: ColumnMapping[],
  batchSize?: number,
  concurrency?: number,
): Promise<ProcessResponse> {
  return new Promise(async (resolve, reject) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, batchSize, concurrency, mappings }),
      });
    } catch {
      reject(new Error('Failed to connect to server'));
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Processing failed' }));
      reject(new Error(err.error || `HTTP ${res.status}`));
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function processLine(line: string) {
      if (!line.trim()) return;
      try {
        const data = JSON.parse(line);
        if (data.type === 'progress') {
          onProgress(data.imported, data.skipped, data.total);
        } else if (data.type === 'done') {
          resolve({
            imported: data.imported,
            skipped: data.skipped,
            totalImported: data.imported.length,
            totalSkipped: data.skipped.length,
            totalRows: data.imported.length + data.skipped.length,
          });
        } else if (data.type === 'error') {
          reject(new Error(data.message));
        }
      } catch {
        // ignore partial lines
      }
    }

    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) {
          if (buffer.trim()) processLine(buffer);
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) processLine(line);
        pump();
      }).catch(reject);
    }

    pump();
  });
}
