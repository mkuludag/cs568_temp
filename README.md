# CS568: Epidemic Forecasting Dashboard with AI Advisory Panel

A full-stack public health forecasting platform designed for CDC-style epidemic surveillance. Combines traditional statistical models (ARIMA, SEIR) with an AI-powered multi-agent advisory panel to assist public health officials in decision-making.

## 🎯 Key Features

- **Multi-Model Forecasting**: ARIMA, SEIR, and weighted Ensemble models with 50/80/95% confidence intervals
- **4-Week Forecasts**: Hospital admission projections for influenza and COVID-19
- **AI Advisory Panel**: Epidemiologist, Healthcare Systems Analyst, Health Economist, and Consensus agent perspectives
- **CDC-Style UI**: Clean, professional interface matching current public health standards
- **Geographic Flexibility**: Support for US national, state, territorial, and HHS regional data
- **Real-time Data Integration**: Live CDC NHSN Socrata API with mock fallback
- **Export Capabilities**: PDF reports and data downloads

---

## 📂 Repository Structure

```
cs568/
├── backend/                      # FastAPI forecasting engine
│   ├── main.py                   # API entry point
│   ├── config.py                 # Constants & configuration
│   ├── requirements.txt           # Python dependencies
│   │
│   ├── models/                   # Forecasting algorithms
│   │   ├── base.py               # Pydantic schemas & types
│   │   ├── arima_model.py        # ARIMA/SARIMA time series
│   │   ├── seir_model.py         # Compartmental epidemiological model
│   │   ├── ensemble.py           # Weighted ensemble combiner
│   │
│   ├── agents/                   # AI advisory panel
│   │   ├── placeholder.py        # Template-based responses (ready for swap)
│   │   └── __init__.py
│   │
│   ├── routers/                  # API endpoints
│   │   ├── forecasts.py          # GET /api/forecasts, /api/jurisdictions
│   │   ├── agents.py             # POST /api/agents/analyze
│   │   └── __init__.py
│   │
│   └── data/                     # Data sources
│       ├── cdc_loader.py         # CDC NHSN Socrata API wrapper
│       ├── mock_data.py          # Fallback test data
│       └── __init__.py
│
└── frontend/                      # React + TypeScript dashboard
    ├── package.json              # NPM dependencies
    ├── tsconfig.json             # TypeScript config
    ├── vite.config.ts            # Vite build config
    │
    ├── src/
    │   ├── App.tsx               # Root component & navigation
    │   ├── main.tsx              # React entry point
    │   │
    │   ├── components/           # React UI components
    │   │   ├── dashboard/        # Forecast & data visualization
    │   │   │   ├── DashboardPage.tsx    # Main orchestrator
    │   │   │   ├── ControlPanel.tsx     # Disease/jurisdiction selectors
    │   │   │   ├── ModelSelector.tsx    # Toggle ARIMA/SEIR/Ensemble
    │   │   │   ├── ForecastChart.tsx    # Recharts visualization
    │   │   │   ├── SummaryCards.tsx     # Key metrics cards
    │   │   │   ├── MapView.tsx          # Geographic display
    │   │   │   ├── DataTable.tsx        # Tabular forecast data
    │   │   │   └── ExportTools.tsx      # PDF/CSV export
    │   │   │
    │   │   ├── agents/          # AI advisory panel
    │   │   │   ├── AgentPanel.tsx       # Container for 4 agents
    │   │   │   ├── AgentCard.tsx        # Individual agent card (role + analysis)
    │   │   │   ├── AgentToggle.tsx      # Enable/disable agents
    │   │   │   ├── ConsensusView.tsx    # Cross-model consensus
    │   │   │   └── __init__.py
    │   │   │
    │   │   └── layout/          # Page structure
    │   │       ├── GovBanner.tsx        # USWDS header
    │   │       ├── Header.tsx           # Logo & title bar
    │   │       ├── Sidebar.tsx          # Navigation
    │   │       ├── Breadcrumb.tsx       # Current location indicator
    │   │       └── Footer.tsx           # Copyright/links
    │   │
    │   ├── hooks/               # React data fetching logic
    │   │   ├── useForecast.ts   # Forecast data & chart building
    │   │   └── useAgents.ts     # Agent advisory panel
    │   │
    │   ├── services/            # API client & types
    │   │   ├── api.ts           # Fetch functions (getForecasts, analyzeScenario)
    │   │   └── types.ts         # TypeScript interfaces
    │   │
    │   ├── styles/
    │   │   ├── cdc-theme.css    # CDC brand colors & layout
    │   │   └── dashboard.css    # Component-specific styles
    │   │
    │   ├── react-simple-maps.d.ts  # Type declarations
    │   └── index.html           # Static HTML entry

```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 18+** with npm
- **Internet access** for CDC API (falls back to mock data if unavailable)

### Backend Setup

```bash
cd backend

# Create virtual environment (optional, recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Check health at `/api/health`.

**API Endpoints:**
- `GET /api/jurisdictions` — List all available jurisdictions (states, regions, national)
- `GET /api/forecasts?disease=flu&jurisdiction=USA&models=arima,seir,ensemble` — Get forecasts with confidence intervals
- `POST /api/agents/analyze` — Run AI advisory panel on a scenario

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Development server (opens at http://localhost:5173)
npm run dev

# Production build
npm run build
```

---

## 📊 Data & Models

### Input Data Source
- **Live**: CDC NHSN Socrata API (`https://data.cdc.gov/resource/mpgq-jmmr.json`)
- **Weekly** hospital admissions for flu & COVID-19
- **Fallback**: Mock data if API fails
- **Coverage**: US national, 50 states + DC + territories + HHS regions

### Forecasting Models

#### ARIMA (AutoRegressive Integrated Moving Average)
- Use case: Short-term trends, quick computation
- Order: SARIMA(1,1,1)(1,0,1,52) with 52-week seasonality when 2+ years data available; falls back to ARIMA(2,1,2)
- Output: Point forecasts + 50/80/95% prediction intervals
- File: `backend/models/arima_model.py`

#### SEIR (Susceptible-Exposed-Infectious-Recovered)
- Use case: Epidemiologically grounded compartmental dynamics
- Method: Monte Carlo stochastic simulation (200 runs)
- Output: Quantile-based prediction intervals (50/80/95%)
- File: `backend/models/seir_model.py`

#### Ensemble
- Combines ARIMA & SEIR via weighted average (default: 50/50)
- Produces tighter intervals by blending both forecasts
- Falls back to 100% of either model if one fails
- File: `backend/models/ensemble.py`

---

## 🤖 AI Advisory Panel (Agent System)

### Current Status: **Placeholder Ready for Integration**

The agent system is **stubbed out and ready for your real multi-agent module** from your teammates.

### Integration Point

**File:** `backend/agents/placeholder.py`  
**Function:** `run_all_agents(scenario: AgentScenario) -> AgentResponse`

This is the single swap point. Currently returns template-based responses; swap with the real OpenAI multi-agent system.

### Input Format (AgentScenario)

```python
{
  "disease": "flu",                      # "flu" or "covid"
  "location": "USA",                     # jurisdiction code
  "current_week_admissions": 12500.0,    # float: latest week value
  "four_week_trend": "increasing",       # "increasing" | "decreasing" | "stable"
  "percent_change": 15.3,                # float: % change over past 4 weeks
  "forecast_summary": "admissions are expected to increase over the next 4 weeks."
                                         # str: natural language summary
}
```

### Output Format (AgentResponse)

```python
{
  "epi": {
    "role": "Epidemiologist",
    "analysis": "Hospital admissions for influenza in USA are currently increasing..."
  },
  "healthcare": {
    "role": "Healthcare Systems Analyst",
    "analysis": "Current admission volume suggests elevated hospital capacity..."
  },
  "economist": {
    "role": "Health Economist",
    "analysis": "Increased admissions will likely strain marginal resources..."
  },
  "consensus": {
    "role": "Consensus",
    "analysis": "Across all perspectives, public health action recommended..."
  }
}
```

### How It Flows in the UI

1. **Enable Agents**: User toggles agent advisory on/off in the dashboard sidebar
2. **Trigger Analysis**: When enabled + forecast data loads, frontend computes `AgentScenario` from current data
3. **Call Backend**: `POST /api/agents/analyze` with scenario JSON
4. **Render Panels**: Response renders as 4 cards (3 agents + consensus) with their role-based analysis

---

## 📡 Frontend-Backend Communication

### Data Flow

```
User selects disease/jurisdiction/models
    ↓
Frontend.DashboardPage: useEffect triggers useForecast hook
    ↓
useForecast calls: getForecasts(disease, jurisdiction, models)
    ↓
Frontend.services.api: Sends GET /api/forecasts?...
    ↓
Backend.routers.forecasts: Fetches CDC data → runs ARIMA/SEIR concurrently
    ↓
Backend.models: Returns ForecastResult[] with history + forecasts
    ↓
Frontend: useForecast builds ChartData (merges models) → renders ForecastChart
    ↓
If agents enabled:
  - DashboardPage computes AgentScenario from current forecast
  - useAgents hook → POST /api/agents/analyze
  - Backend: run_all_agents() returns AgentResponse
  - Frontend: AgentPanel renders 4 agent cards
```

### API Contracts

**Get Forecasts**
```
GET /api/forecasts
?disease=flu
&jurisdiction=USA
&models=arima,seir,ensemble

Response: [{
  "model": "arima",
  "disease": "flu",
  "jurisdiction": "USA",
  "history": [
    { "week_end": "2024-01-06", "admissions": 12000, "admissions_per100k": 3.6 },
    ...
  ],
  "forecasts": [
    {
      "week_end": "2024-01-13",
      "point": 12500,
      "lower_95": 11000,
      "upper_95": 14000,
      "lower_80": 11500,
      "upper_80": 13500,
      "lower_50": 12100,
      "upper_50": 12900
    },
    ...
  ]
}]
```

**Analyze Agents**
```
POST /api/agents/analyze
Content-Type: application/json

{
  "disease": "flu",
  "location": "USA",
  "current_week_admissions": 12500,
  "four_week_trend": "increasing",
  "percent_change": 15.3,
  "forecast_summary": "admissions are expected to increase over the next 4 weeks."
}

Response: {
  "epi": { "role": "Epidemiologist", "analysis": "..." },
  "healthcare": { "role": "Healthcare Systems Analyst", "analysis": "..." },
  "economist": { "role": "Health Economist", "analysis": "..." },
  "consensus": { "role": "Consensus", "analysis": "..." }
}
```

---

## 🔧 Configuration

### Backend (`config.py`)

```python
FORECAST_HORIZON = 4           # Weeks ahead to forecast
HISTORY_WEEKS = 52             # Weeks of historical data to fetch
SEIR_MONTE_CARLO_RUNS = 200    # SEIR simulation count
ENSEMBLE_WEIGHTS = {           # Model weights
  "arima": 0.5,
  "seir": 0.5
}
```

### Frontend (`frontend/src/services/api.ts`)

```typescript
const API_BASE = "/api";  // Backend API base URL
```

---

## 🧪 Testing & Development

### Manual Testing

```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev

# Open browser: http://localhost:5173
```

### Try the API

```bash
# Get jurisdictions
curl http://localhost:8000/api/jurisdictions

# Get flu forecasts for USA (all models)
curl "http://localhost:8000/api/forecasts?disease=flu&jurisdiction=USA&models=arima,seir,ensemble"

# Analyze with agents (using curl + JSON file)
curl -X POST http://localhost:8000/api/agents/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "flu",
    "location": "USA",
    "current_week_admissions": 12500,
    "four_week_trend": "increasing",
    "percent_change": 15.3,
    "forecast_summary": "admissions are expected to increase over the next 4 weeks."
  }'
```

---

## 📖 What You Can Do With This

### ✅ Currently Working

1. **View Forecasts**: Select disease/jurisdiction/models → visualize 4-week ahead predictions with confidence bands
2. **Compare Models**: Side-by-side ARIMA vs SEIR vs Ensemble on interactive charts
3. **Explore by Geography**: National, state-level, HHS regional breakdowns
4. **Export Data**: PDF reports and CSV exports for meetings/briefings
5. **AI Advisory (Placeholder)**: Enable agent panel to see template responses (ready for real agents)
6. **Responsive UI**: Works on desktop, tablet-ready layout

### 🚧 Ready to Integrate

1. **Real AI Agents**: Swap `backend/agents/placeholder.py` with real OpenAI multi-agent module
   - Just replace `run_all_agents()` function body
   - Keep the same input/output types
   - Frontend automatically renders results

2. **Custom Models**: Add new forecasting models in `backend/models/`
   - Implement same interface as ARIMA/SEIR
   - Register in routers/forecasts.py
   - UI will auto-support new model in selector

3. **Custom Jurisdictions**: Edit `backend/config.py` → JURISDICTIONS dict

4. **Styling**: CDC colors & layout in `frontend/src/styles/cdc-theme.css`

---

## 🏗️ Architecture

### Backend Stack
- **FastAPI**: Modern async Python web framework
- **statsmodels**: ARIMA/SARIMA time series
- **Custom SEIR**: Stochastic compartmental model
- **httpx**: Async HTTP client for CDC API
- **Pydantic**: Data validation & serialization

### Frontend Stack
- **React 18**: UI framework
- **TypeScript**: Type-safe code
- **Recharts**: Interactive charts with confidence bands
- **Vite**: Fast build tool & dev server
- **CSS**: CDC brand styling (no CSS-in-JS)

### API Design
- RESTful endpoints (GET for queries, POST for agents)
- JSON request/response
- Async/await for concurrent model runs
- CORS enabled for localhost (configurable)

---

## 📝 Key Files to Understand

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app setup, CORS config |
| `backend/routers/forecasts.py` | Core API logic for /forecasts endpoint |
| `backend/routers/agents.py` | Agent advisory endpoint |
| `backend/agents/placeholder.py` | **Integration point** for real agents |
| `backend/models/base.py` | All Pydantic schemas (key for extending) |
| `backend/models/arima_model.py` | ARIMA implementation |
| `backend/models/seir_model.py` | SEIR implementation |
| `backend/data/cdc_loader.py` | CDC API integration |
| `frontend/src/App.tsx` | Root React component |
| `frontend/src/components/dashboard/DashboardPage.tsx` | Main dashboard orchestrator |
| `frontend/src/components/agents/AgentPanel.tsx` | Renders agent advisory cards |
| `frontend/src/hooks/useForecast.ts` | Forecast data fetching logic |
| `frontend/src/hooks/useAgents.ts` | Agent advisory fetching logic |
| `frontend/src/services/api.ts` | HTTP client functions |

---

## 🐛 Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'statsmodels'
→ pip install -r requirements.txt
```

### Frontend won't connect to backend
```
Error: Failed to fetch /api/forecasts
→ Ensure backend is running on http://localhost:8000
→ Check CORS config in backend/main.py
```

### No forecast data appears
```
→ CDC API may be down; check 'Falls back to mock data'
→ Ensure jurisdiction code exists in backend/config.py
→ Check browser Network tab for 200/400/500 responses
```

### Agent advisory doesn't appear
```
→ Enable "AI Advisory" toggle in sidebar
→ Check console for errors (F12 → Console)
→ Ensure at least 5 weeks of history data exist
```

---

## 📚 Next Steps

1. **Integrate Real Agents**: Replace `placeholder.py` with teammates' multi-agent module
2. **Customize Prompts**: Refine agent role descriptions in agents module
3. **Add More Jurisdictions**: Extend backend/config.py with territories/regions
4. **Production Deployment**: Docker containerization, SSL, production DB if needed
5. **Performance**: Cache forecast data, precompute models, optimize frontend bundle

---

## 📄 License & Citation

This project is part of the CS568 course on epidemic forecasting for public health.

---

## 👥 Team

- **UI/Frontend**: You (this repo)
- **Agents**: Teammates (OpenAI multi-agent module — ready to integrate)
- **Data**: CDC NHSN team (Socrata API)

---

## 📞 Questions?

- **Why ARIMA + SEIR?**: Complements each other — ARIMA catches trends, SEIR captures epidemiology
- **Why ensemble?**: Combines strengths; reduces variance of either model alone
- **Why placeholder agents?**: Allows parallel development — UI ready before agent module finalized
- **How to test locally?**: Follow "Quick Start" → all systems work with mock CDC data fallback

