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

export async function processCSV(
  rows: Record<string, string>[],
  onProgress?: (imported: number, skipped: number, total: number) => void
): Promise<ProcessResponse> {
  const BATCH_SIZE = 10;
  let allImported: Record<string, string>[] = [];
  let allSkipped: { rowNumber: number; rawData: string; reason: string }[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: batch, batchSize: BATCH_SIZE }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Processing failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data: ProcessResponse = await res.json();
    allImported.push(...data.imported);
    allSkipped.push(...data.skipped);
    onProgress?.(allImported.length, allSkipped.length, rows.length);
  }

  return {
    imported: allImported,
    skipped: allSkipped,
    totalImported: allImported.length,
    totalSkipped: allSkipped.length,
    totalRows: rows.length,
  };
}
