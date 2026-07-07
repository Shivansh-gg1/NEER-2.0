# NEER — Next Gen Evaluation for Environmental Recharge

AI-assisted Rooftop Rainwater Harvesting Feasibility Assessment for Delhi.

---

## Project Structure

```
NEER/
├── frontend/   — React + Vite app (port 3000)
└── backend/    — Next.js API routes (port 3001)
```

---

## Setup & Running

### Step 1 — Backend

```bash
cd backend
npm install
```

Create a `.env.local` file in the `backend/` folder:

```
GEE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...paste full JSON here on one line..."}
```

Then run:

```bash
npm run dev
```

Backend will start on **http://localhost:3001**

---

### Step 2 — Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will open at **http://localhost:3000**

---

## Changes in This Version

### Bug Fixes
- Fixed missing `PropertyDetailsStepProps` TypeScript type (was causing import error)
- Fixed duplicate calculation logic — dashboard now uses API response directly
- Fixed unit annotation ambiguity (sq ft vs sq m) throughout

### Backend Improvements
- **OSM Fallback**: Building footprint detection now tries Google Earth Engine first,
  then falls back to OpenStreetMap Overpass API if EE fails or times out.
  If both fail, user gets a clean manual entry prompt instead of a crash.
- **EE Timeout**: Earth Engine calls now have a 12-second hard timeout so the app
  never hangs during a demo.
- **Cache wired in**: Building footprint route now uses the cache (24hr TTL).
  Repeated queries for the same location return instantly.
- **Real structure sizing**: Percolation pit and storage tank are now sized using
  IS:10500/CGWB and IS:2470 engineering formulas instead of hardcoded values.
- **Monthly rainfall distribution**: Weather route now returns actual monthly
  fractions from 30-year Open-Meteo data, used in calculations for any location.
- **Credentials secured**: Earth Engine credentials loaded from environment
  variables only — never from committed files.

### Frontend Improvements  
- Results dashboard shows Percolation Pit and Storage Tank design cards
  with real dimensions, layer configurations, and engineering notes.
- PropertyDetailsStep shows a helpful yellow banner when building detection
  fails, prompting manual roof area entry instead of crashing.
- Recharge Potential badge is now dynamic (High/Medium/Low) based on actual
  calculated volume.
