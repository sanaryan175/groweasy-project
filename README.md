# Groweasy CSV Import

A full-stack CSV import application that uses AI to extract CRM records from uploaded CSV files. Built with Next.js, Express, and OpenAI.

## Architecture

```
groweasy-project/
├── frontend/          # Next.js 16 + React 19 + Tailwind CSS v4
│   ├── app/           # Pages (main import flow, demo)
│   ├── components/    # UI components (stepper, upload, preview, processing, results)
│   └── lib/           # API client utilities
├── backend/           # Express + TypeScript
│   ├── src/
│   │   ├── routes/    # API endpoints (upload, process)
│   │   ├── services/  # CSV parser, AI extractor
│   │   └── types/     # TypeScript types
│   └── ...
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- OpenAI API key

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm install
npm run dev
```

Server starts on `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App starts on `http://localhost:3000`.

### 3. Docker

```bash
docker-compose up --build
```

## API Endpoints

### `POST /api/upload`

Upload a CSV file. Accepts `multipart/form-data` with a `file` field.

**Response:**
```json
{
  "filename": "customers.csv",
  "size": 1234,
  "headers": ["Name", "Email", "..."],
  "rows": [...],
  "totalRows": 100
}
```

### `POST /api/process`

Process parsed rows through AI extraction. Accepts JSON with `rows` array.

**Response:**
```json
{
  "imported": [...],
  "skipped": [...],
  "totalImported": 95,
  "totalSkipped": 5,
  "totalRows": 100
}
```

## CRM Fields Extracted

| Field | Description |
|---|---|
| created_at | Lead creation date |
| name | Lead name |
| email | Primary email |
| country_code | Country code |
| mobile_without_country_code | Mobile number |
| company | Company name |
| city | City |
| state | State |
| country | Country |
| lead_owner | Lead owner |
| crm_status | Lead status (GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE) |
| crm_note | Notes / extra info |
| data_source | Source (leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots) |
| possession_time | Property possession time |
| description | Additional description |

## AI Prompt Rules

- Only 4 allowed CRM statuses
- Only 5 allowed data sources (or blank)
- If multiple emails/mobiles: first is primary, rest go to `crm_note`
- Records without both email and mobile are skipped
- Dates must be `new Date()` parsable

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, shadcn/ui
- **Backend:** Express, TypeScript
- **AI:** OpenAI GPT-4o-mini
- **Deployment:** Docker, Vercel/Railway-ready
