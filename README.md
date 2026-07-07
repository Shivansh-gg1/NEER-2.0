# 💧 NEER — Smart Rainwater Harvesting Assessment Platform

> **NEER** (meaning *water* in Hindi) is an intelligent, location-aware web application that helps homeowners, urban planners, and municipalities assess the feasibility and potential of rainwater harvesting for any property in India.

---

## 🌟 Features

- 📍 **Interactive Location Selection** — Click on a map, search by address, or enter coordinates to pinpoint any property
- 🏠 **Automatic Building Footprint Detection** — Detects rooftop area automatically using Google Earth Engine satellite imagery
- ✏️ **Manual Footprint Drawing** — Draw and edit the rooftop polygon directly on the map when auto-detection isn't available
- 🌧️ **Real-time Rainfall Data** — Fetches location-specific annual & monthly rainfall data automatically
- 📊 **Detailed Results Dashboard** — Calculates annual rainwater harvest potential, monthly breakdowns, cost savings, and environmental impact
- 📄 **PDF Report Export** — Download a full assessment report as a PDF

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Leaflet / React-Leaflet | Interactive maps |
| Leaflet Geoman | Polygon drawing & editing |
| Radix UI + Tailwind CSS v4 | Component library & styling |
| Framer Motion | Animations |
| Recharts | Data visualization |
| jsPDF + html2canvas | PDF report generation |

### Backend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | API server |
| Google Earth Engine SDK | Satellite building footprint detection |
| Nominatim (OpenStreetMap) | Geocoding & reverse geocoding |
| Open-Meteo API | Historical rainfall data |
| Winston | Logging |
| Node Cache | Response caching |

---

## 📁 Project Structure

```
NEER-main/
├── frontend/               # React + Vite frontend app
│   └── src/
│       ├── components/     # UI components (Map, Steps, Dashboard, Landing)
│       ├── services/       # API service calls
│       ├── styles/         # CSS stylesheets
│       └── types.ts        # Shared TypeScript types
│
└── backend/                # Next.js API server
    └── src/app/api/
        ├── building-footprint/   # GEE satellite rooftop detection
        ├── calculate/            # Rainwater harvest calculation engine
        ├── geocode/              # Address → coordinates
        ├── reverse-geocode/      # Coordinates → address
        └── weather/              # Rainfall data fetching
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- A **Google Cloud Service Account** with the **Google Earth Engine API** enabled
- The service account must be registered at [earthengine.google.com](https://earthengine.google.com)

### 1. Clone the Repository

```bash
git clone https://github.com/Shivansh-gg1/NEER-2.0.git
cd NEER-2.0
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and add your Google Earth Engine credentials:

```env
# Option A: Paste the full service account JSON as a single-line string
GEE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}

# Option B: Use separate variables
GEE_SERVICE_ACCOUNT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
GEE_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----

NODE_ENV=development
NOMINATIM_EMAIL=your-email@example.com
```

> ⚠️ **Never commit your `.env` file or credential JSON files to git.**

### 3. Install & Run the Backend

```bash
# Inside /backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### 4. Install & Run the Frontend

```bash
# Open a new terminal, inside /frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 5. Open the App

Navigate to **http://localhost:5173** in your browser.

---

## 🔌 API Endpoints

All endpoints are served from `http://localhost:3001`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/geocode` | Convert address text to coordinates |
| `POST` | `/api/reverse-geocode` | Convert coordinates to address |
| `POST` | `/api/weather` | Get annual & monthly rainfall for a location |
| `POST` | `/api/building-footprint` | Detect rooftop footprint area via satellite |
| `POST` | `/api/calculate` | Calculate rainwater harvest potential |

---

## 🧭 How It Works

```
1. User selects a location on the map
        ↓
2. Backend fetches address + rainfall data in parallel
        ↓
3. Google Earth Engine analyzes satellite imagery to detect rooftop area
        ↓
4. User reviews/adjusts property details (roof material, residents, etc.)
        ↓
5. Calculation engine computes harvest potential, storage needs & savings
        ↓
6. Results Dashboard shows charts, monthly breakdown & PDF report
```

---

## 🌍 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `GEE_SERVICE_ACCOUNT_KEY` | Yes* | Full GEE service account JSON (as string) |
| `GEE_SERVICE_ACCOUNT_EMAIL` | Yes* | GEE service account email (alternative) |
| `GEE_PRIVATE_KEY` | Yes* | Private key for GEE service account (alternative) |
| `NODE_ENV` | No | `development` or `production` |
| `NOMINATIM_EMAIL` | Yes | Your email for Nominatim API (required by their ToS) |

*Use either `GEE_SERVICE_ACCOUNT_KEY` (Option A) **or** both `GEE_SERVICE_ACCOUNT_EMAIL` + `GEE_PRIVATE_KEY` (Option B).

---

## 📜 License

This project is for academic and research purposes.

---

## 🙏 Acknowledgements

- [Google Earth Engine](https://earthengine.google.com/) — Satellite imagery & geospatial analysis
- [OpenStreetMap / Nominatim](https://nominatim.org/) — Geocoding
- [Open-Meteo](https://open-meteo.com/) — Free weather & rainfall data
- [Leaflet](https://leafletjs.com/) — Interactive maps
