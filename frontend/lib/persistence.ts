const KEY = 'groweasy-state';

interface SavedState {
  currentStep: string;
  csvData: {
    rows: Record<string, string>[];
    headers: string[];
  };
  results: unknown;
  columnMappings: { csvColumn: string; crmField: string; confidence: number }[];
  columnAnalysis: unknown;
  analysisError: string | null;
  error: string | null;
}

export function saveState(state: SavedState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function loadState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
