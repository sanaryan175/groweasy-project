# Groweasy AI CSV Importer

An AI-powered CSV import application that intelligently extracts CRM lead information from any CSV format — Facebook Lead Ads, Google Ads, Excel exports, real estate CRM dumps, marketing spreadsheets, or manually created CSVs. The system automatically detects column structures and maps them to the GrowEasy CRM schema using AI.

---

## Features

- **Drag-and-drop CSV upload** with inline file validation and error feedback
- **Responsive preview table** with sticky headers, horizontal/vertical scroll, and paginated rows
- **AI-powered extraction** using OpenAI-compatible LLMs (Groq, DeepSeek, Ollama, Gemini, OpenCode Zen)
- **Auto-detection fast path** — 30+ known column aliases mapped instantly without any AI call
- **Real-time progress streaming** via Server-Sent Events (SSE) with per-record granularity
- **Animated progress bar** that interpolates smoothly between updates for a polished UX
- **Virtualized results table** using `@tanstack/react-virtual` — handles 100k+ records without jank
- **Dark mode toggle** persisted to `localStorage`
- **React Error Boundary** wrapping the entire app for graceful crash recovery
- **Demo page** (`/demo`) showcasing all steps with sample data
- **Docker support** with `docker-compose up`
- **23 unit tests** covering core extraction logic

---

## Architecture

```
groweasy-project/
├── frontend/                          # Next.js 16 + React 19 + Tailwind v4
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (ErrorBoundary + DarkModeToggle)
│   │   ├── page.tsx                   # Main import flow orchestrator
│   │   ├── globals.css                # Tailwind + shadcn CSS variables (light/dark)
│   │   └── demo/page.tsx              # Standalone demo with canned data
│   ├── components/
│   │   ├── steps/
│   │   │   ├── upload-step.tsx        # Drag-drop + file picker, client-side CSV parse
│   │   │   ├── preview-step.tsx       # Paginated table preview (no AI yet)
│   │   │   ├── processing-step.tsx    # Animated progress bar + checklist
│   │   │   └── results-step.tsx       # Virtualized table with search/filter/export
│   │   ├── stepper.tsx                # 4-step visual stepper
│   │   ├── animated-counter.tsx       # RAF-based number animation
│   │   ├── error-boundary.tsx         # Class-based React error boundary
│   │   └── dark-mode-toggle.tsx       # Sun/Moon toggle, persisted
│   └── lib/
│       └── api.ts                     # API client (upload, analyze, processCSVStream)
├── backend/                           # Express + TypeScript
│   ├── src/
│   │   ├── index.ts                   # Express server, middleware, route mounting
│   │   ├── routes/
│   │   │   ├── upload.ts              # POST /api/upload (multer + csv-parser)
│   │   │   ├── analyze.ts             # POST /api/analyze (column AI analysis)
│   │   │   └── process.ts             # POST /api/process (SSE streaming extraction)
│   │   ├── services/
│   │   │   ├── csv-parser.ts          # RFC 4180 CSV parser (handles quoted fields)
│   │   │   ├── column-mapper.ts       # AI column analysis + mapping prompt builder
│   │   │   ├── ai-extractor.ts        # Batch AI extraction, retries, fallback, auto-detect
│   │   │   ├── ai-extractor.test.ts   # 23 unit tests (vitest)
│   │   │   └── index.ts               # Service barrel exports
│   │   └── types/
│   │       ├── crm.ts                 # CRMRecord, ParsedCSV, ProcessingResult, enums
│   │       └── column-mapping.ts      # ColumnMapping, CSVAnalysis, CRM_FIELDS, CSV_FORMAT_EXAMPLES
│   ├── vitest.config.ts
│   └── Dockerfile
├── docker-compose.yml                 # Frontend + backend orchestration
└── README.md
```

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, `@tanstack/react-virtual`, `lucide-react` |
| Backend  | Express 4, TypeScript 5, multer, OpenAI SDK, `p-limit` |
| AI       | OpenAI-compatible API (Groq, DeepSeek, Ollama, Gemini, OpenCode Zen) |
| Testing  | Vitest 4                                        |
| Deploy   | Docker, Vercel/Railway-ready                    |

---

## Quick Start

### Prerequisites

- Node.js 20+
- An AI API key (Groq, DeepSeek, OpenCode Zen, or local Ollama)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — add GROQ_API_KEY, choose AI_PROVIDER and GROQ_MODEL
npm install
npm run dev
```

Starts on **http://localhost:3001**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Starts on **http://localhost:3000**.

### 3. Docker (both services)

```bash
docker-compose up --build
```

Frontend on **:3000**, backend on **:3001**.

---

## API Endpoints

### `POST /api/upload`

Upload a CSV file (`multipart/form-data`, field name `file`). Max 20 MB, CSV only.

**Response:**
```json
{
  "filename": "customers.csv",
  "size": 1234,
  "headers": ["Name", "Email", "Phone"],
  "rows": [...],        // first 20 rows
  "totalRows": 1500
}
```

### `POST /api/analyze`

Analyze column headers and suggest CRM field mappings using AI.

```json
{
  "headers": ["Full Name", "Email", "Phone Number"],
  "sampleRows": [...]
}
```

**Response:**
```json
{
  "csvType": "Facebook Lead Ads",
  "csvTypeDescription": "Facebook lead gen export",
  "mappings": [
    { "csvColumn": "Full Name", "crmField": "name", "confidence": 1 },
    { "csvColumn": "Email", "crmField": "email", "confidence": 1 }
  ],
  "unmappedColumns": [],
  "missingRequiredFields": []
}
```

### `POST /api/process`

Process rows through AI extraction. Returns a streaming NDJSON response with progress updates and a final `done` event.

**Request:**
```json
{
  "rows": [...],
  "batchSize": 50,
  "concurrency": 5,
  "mappings": [...]
}
```

**Streaming response (NDJSON):**
```
{"type":"progress","imported":10,"skipped":0,"total":100}
{"type":"progress","imported":25,"skipped":1,"total":100}
...
{"type":"done","imported":[...],"skipped":[...]}
```

### `GET /api/health`

```json
{ "status": "ok", "timestamp": "2026-07-09T..." }
```

---

## CRM Fields Extracted

| Field                         | Description                  | Constraints                        |
|-------------------------------|------------------------------|------------------------------------|
| `created_at`                  | Lead creation date           | Any `new Date()`-parsable format   |
| `name`                        | Lead full name               |                                    |
| `email`                       | Primary email                | First if multiple; rest → crm_note |
| `country_code`                | Country code (e.g. +91)      |                                    |
| `mobile_without_country_code` | Mobile number                | First if multiple; rest → crm_note |
| `company`                     | Company name                 |                                    |
| `city`                        | City                         |                                    |
| `state`                       | State / region               |                                    |
| `country`                     | Country                      |                                    |
| `lead_owner`                  | Assigned person/email        |                                    |
| `crm_status`                  | Pipeline status              | One of `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`, or blank |
| `crm_note`                    | Notes / extra emails/mobiles |                                    |
| `data_source`                 | Lead source                  | One of `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`, or blank |
| `possession_time`             | Property possession time     |                                    |
| `description`                 | General comments             |                                    |

---

## Deployment

### Vercel (Frontend)

1. Push the repository to GitHub/GitLab.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo.
3. Set **Root Directory** to `frontend`.
4. **Framework Preset** — Vercel auto-detects Next.js. Keep defaults.
5. Add environment variable:

   | Name                    | Value                                 |
   |-------------------------|---------------------------------------|
   | `NEXT_PUBLIC_API_URL`   | `https://your-backend.onrender.com/api` |

6. Click **Deploy**. Vercel builds and deploys automatically.

### Render (Backend)

Render supports two deployment methods. Choose **one**:

#### Option A — Docker (recommended)

Uses the existing `backend/Dockerfile`.

1. Go to [render.com](https://render.com) → **New** → **Web Service** → Connect your repo.
2. **Root Directory** → `backend`
3. **Runtime** → `Docker`
4. Leave **Docker Command** blank (the `CMD` in the Dockerfile handles startup).
5. Leave **Pre-deploy Command** blank.
6. Add environment variables:

   | Variable            | Value                             |
   |---------------------|-----------------------------------|
   | `AI_PROVIDER`       | `groq` (or your provider)         |
   | `GROQ_API_URL`      | `https://api.groq.com/openai/v1`  |
   | `GROQ_API_KEY`      | Your API key                      |
   | `GROQ_MODEL`        | `qwen/qwen3-32b`                  |
   | `PORT`              | `3001`                            |

7. **Health Check Path** → `/api/health`
8. Click **Create Web Service**.

#### Option B — Node (no Docker)

1. Go to [render.com](https://render.com) → **New** → **Web Service** → Connect your repo.
2. **Root Directory** → `backend`
3. **Runtime** → `Node`
4. **Build Command**:
   ```bash
   npm install && npm run build
   ```
5. **Start Command**:
   ```bash
   npm start
   ```
6. Leave **Pre-deploy Command** blank.
7. Add the same environment variables as Option A above, plus:

   | Variable         | Value |
   |------------------|-------|
   | `NODE_VERSION`   | `20`  |

8. **Health Check Path** → `/api/health`
9. Click **Create Web Service**.

> **CORS note:** The backend already allows all origins via `cors()`. For production, lock it down by editing `backend/src/index.ts`:
> ```ts
> app.use(cors({ origin: 'https://your-app.vercel.app' }));
> ```

### Environment Summary

| Service  | Provider | URL                          |
|----------|----------|------------------------------|
| Frontend | Vercel   | `https://your-app.vercel.app`    |
| Backend  | Render   | `https://your-backend.onrender.com` |

Set `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api` in Vercel, and the frontend will communicate with the deployed backend.

---

## AI Extraction Pipeline

1. **Auto-detect mappings** — CSV headers are checked against 30+ known column aliases (e.g. `full_name` → `name`, `phone number` → `mobile_without_country_code`). If **every** column maps successfully, the entire import runs instantly via `importFromRawData` with zero AI calls.

2. **Batch extraction** — Records are split into configurable batches (`GROQ_BATCH_SIZE`, default 50). Each batch is sent to the AI model with a structured prompt requesting JSON output.

3. **Concurrent processing** — Batches run concurrently (`GROQ_CONCURRENCY`, default 5) using `p-limit`.

4. **Fallback logic** — If a batch exceeds the model's context window, it is recursively split in half. If the AI request fails or returns a malformed response, the system falls back to direct field mapping via `importFromRawData`.

5. **Progress streaming** — Each record processed triggers an SSE progress event sent to the frontend. The frontend interpolates these updates using `requestAnimationFrame` for a smooth 5→10→15 style animation.

6. **Validation** — Each record is validated against allowed CRM statuses and data sources. Invalid values are blanked rather than defaulted.

---

## Known Column Aliases (Auto-Detect)

The following headers are recognized automatically (case-insensitive, underscore/hyphen tolerant):

`email`, `e-mail`, `email address`, `mobile`, `phone`, `mobile number`, `phone number`, `name`, `full name`, `customer name`, `company`, `company name`, `organization`, `city`, `state`, `province`, `country`, `country code`, `lead owner`, `owner`, `crm status`, `status`, `data source`, `source`, `description`, `notes`, `crm note`, `possession time`, `created at`, `created date`

---

## Dark Mode

Toggle dark mode via the Sun/Moon icon in the top-right corner. The preference is persisted to `localStorage`. All components include `dark:` Tailwind variants. The `globals.css` defines CSS custom properties for both light and dark palettes, with automatic system-preference detection via `prefers-color-scheme`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable            | Default                          | Description                         |
|---------------------|----------------------------------|-------------------------------------|
| `AI_PROVIDER`       | `opencode-zen`                   | Provider label (informational)      |
| `GROQ_API_URL`      | `http://localhost:11434/v1`      | OpenAI-compatible base URL          |
| `GROQ_API_KEY`      | —                                | API key                             |
| `GROQ_MODEL`        | `qwen3.5:latest`                 | Model name                          |
| `GROQ_BATCH_SIZE`   | `50`                             | Records per AI batch                |
| `GROQ_CONCURRENCY`  | `5`                              | Concurrent batch count              |
| `GROQ_TIMEOUT`      | `60000`                          | AI request timeout (ms)             |
| `PORT`              | `3001`                           | Server port                         |

### Frontend (`frontend/.env.local`)

| Variable                | Default                        | Description          |
|-------------------------|--------------------------------|----------------------|
| `NEXT_PUBLIC_API_URL`   | `http://localhost:3001/api`    | Backend API base URL |

---

## Demo Page

Visit `/demo` to explore the UI with pre-loaded sample data without connecting to a backend. Use the step buttons at the top to navigate between Upload, Preview, Processing, and Results views.

---

## Testing

```bash
cd backend
npm test        # vitest run (23 tests)
```

Tests cover:
- `splitValue` — parsing multiple emails/mobiles with various separators
- `autoDetectMappings` — matching known headers with underscore/hyphen tolerance
- `importFromRawData` — email/mobile extraction, skipping logic, row numbering
- CRM status and data source validation
