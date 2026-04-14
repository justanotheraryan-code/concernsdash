# ConcernsDash

An **Academics Director Dashboard** for real-time monitoring and analytics of educational program delivery. Built for academic administrators to track course performance, student feedback, and operational issues across Post Graduate Programs (PGP).

## Features

- **Session Tracking** — Monitor delivered sessions with ratings (1–5), attendance percentages, and student comments
- **Ticket Management** — Track academic and operational issues by category (Schedule, Content, Faculty, Assessment, LMS, Operations) with priority levels and SLA monitoring
- **Course & Faculty Health Scoring** — Automated weighted health scores with risk signals for courses and faculty
- **Trend & Anomaly Detection** — Identifies rating drops, attendance crashes, backlog spikes, repeat faculty issues, and underperforming sections
- **Risk Scoring Engine** — Configurable multi-factor weighted risk algorithm
- **Leadership Insights** — Auto-generated actionable summaries for program directors
- **Course Planning** — Track planned vs. delivered sessions across programs, terms, and sections
- **CSV Bulk Import** — Upload session feedback, attendance, tickets, and course plan data from CSV files
- **Dark Mode** — Toggle between light and dark themes (persisted in localStorage)
- **Client-Side Persistence** — All custom data stored in browser localStorage; no backend required

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Charts | Recharts |
| CSV Parsing | PapaParse |
| Icons | Lucide React |
| Linting | ESLint 9 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/justanotheraryan-code/concernsdash.git
cd concernsdash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173` with hot module replacement.

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/         # React UI components
│   ├── ui/             # shadcn/ui base components
│   ├── Dashboard.tsx   # Main dashboard (core layout & state)
│   ├── Charts.tsx      # Recharts visualizations
│   ├── FiltersPanel.tsx
│   ├── InsightPanel.tsx
│   ├── RiskPanel.tsx
│   ├── SessionTable.tsx
│   ├── TicketTable.tsx
│   └── CourseMatrix.tsx
├── lib/                # Core business logic
│   ├── analyticsEngine.ts    # KPIs, risk scoring, health metrics
│   ├── dataProvider.ts       # Data source abstraction layer
│   ├── dataPersistence.ts    # localStorage read/write
│   ├── insightGenerator.ts   # Leadership insight generation
│   ├── anomalyDetection.ts   # Threshold-based anomaly flags
│   └── trendCalculator.ts    # Linear regression / trend signals
├── utils/              # Shared utility functions
├── services/           # External integrations (CSV, API, Google Sheets)
├── config/             # Dashboard constants and thresholds
├── data/               # Mock/sample data (sessions, tickets, plans)
└── types/              # TypeScript type definitions
```

## Data Sources

Configure `DATA_SOURCE` in `src/config/dashboardConfig.ts`:

| Source | Description |
|---|---|
| `mock` (default) | Pre-loaded sample data from `src/data/` |
| `csv` | Upload CSVs directly in the dashboard UI |
| `googleSheets` | Live sync from a Google Sheet (set `GOOGLE_SHEET_ID`) |
| `api` | Fetch from a REST endpoint (set `API_BASE_URL`) |

### CSV Format

| CSV Type | Required Columns |
|---|---|
| Session Feedback | date, program, term, course, professor, section, topic, status, rating, responses, headcount, notes |
| Attendance | date, course, professor, section, attendance%, headcount |
| Tickets | created, resolved, program, term, status, priority, category, owner, title, description, slaHours, course, professor, section |
| Course Plan | program, term, course, section, plannedSessions |

## Configuration

Key constants in `src/config/dashboardConfig.ts`:

```ts
PROGRAMS: ["PGP"]
TERMS:    ["Term 1", "Term 2", "Term 3", "Term 4"]
SECTIONS: ["All", "1", "2", "3", "4", "YLC"]

// Risk score weights
ratingDrop:     0.4
attendanceDrop: 0.3
ticketVolume:   0.2
commentsSignal: 0.1
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript compile + production bundle |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
