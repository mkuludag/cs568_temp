# Changes Summary: Intervention Toggles & Sidebar AI Panel

## Overview
Added two major features to the CS568 Forecasting Dashboard:
1. **Intervention Toggles Panel** - Allows users to simulate public health interventions across 4 forecast weeks
2. **Sidebar AI Advisory Panel** - Moved from below-content tabs to a sticky right-side panel

## Frontend Changes

### 1. New Component: InterventionPanel.tsx
- Location: `/frontend/src/components/dashboard/InterventionPanel.tsx`
- Features:
  - Displays 5 intervention types with full descriptions:
    - School Closures
    - Masking Mandates
    - Transportation Restrictions
    - Gathering Limits
    - Workplace Closures
  - Week-by-week toggles (W1, W2, W3, W4) per intervention
  - "Clear All" button to reset interventions
  - Real-time onChange callbacks to parent
  - Informational note about intervention modeling

### 2. Updated Types: types.ts
- Added `InterventionWeekState` interface
- Added `InterventionState` interface
- Added `InterventionType` type union
- Added `INTERVENTION_LABELS` and `INTERVENTION_DESCRIPTIONS` constants

### 3. Refactored Layout: DashboardPage.tsx
- **New Structure:**
  - **Top:** Control Panel, Model Selector, Agent Toggle (unchanged)
  - **Main Content (Left):** Summary Cards → Chart → Interventions → Export → Map → Data Table
  - **Sidebar (Right):** AI Advisory Panel (sticky, only when enabled)
  - Responsive: On smaller screens (<1200px), sidebar moves below main content

- **State Management:**
  - Added `interventions` state for managing selected interventions
  - Pass interventions to `useForecast` hook
  - Changed default `agentsEnabled` to `true` (so panel is visible by default)

- **Structural Changes:**
  - Wrapped content in `<div className="dashboard-container">` for grid layout
  - Main content in `<div className="dashboard-main">`
  - Sidebar in `<div className="dashboard-sidebar">` (conditional render)

### 4. Updated Hook: useForecast.ts
- Added `interventions` parameter (optional, defaults to [])
- Updated dependency array to include `interventionsKey`
- Passes interventions to `getForecasts()` API call

### 5. Updated API Client: api.ts
- Modified `getForecasts()` to accept `interventions` parameter
- When interventions are provided, sends POST request with intervention payload
- Without interventions, sends GET request (backward compatible)

### 6. Updated Styles: dashboard.css
- Added **`.dashboard-container`** - 2-column grid layout (1fr 320px)
- Added **`.dashboard-main`** - flex column for main content
- Added **`.dashboard-sidebar`** - sticky positioned sidebar with overflow handling
- Added comprehensive **`.intervention-panel`** styles:
  - Header with title, subtitle, and clear button
  - `.intervention-card` - per-intervention container
  - `.intervention-week` - week toggle buttons with active state
  - `.intervention-panel__info` - blue info box with disclaimer
- Responsive media queries for <1200px (stacks vertically) and <768px

## Backend Changes

### 1. Updated Models: models/base.py
- Added **`InterventionWeekState`** - Pydantic model for week-level intervention state
- Added **`InterventionState`** - Pydantic model for complete intervention across 4 weeks
- Added **`InterventionsRequest`** - Request body schema for POST endpoint

### 2. Updated Router: routers/forecasts.py
- Added **`INTERVENTION_EFFECTS`** mapping:
  - `school_closures`: 20% reduction
  - `masking_mandates`: 15% reduction
  - `transportation_restrictions`: 10% reduction
  - `gathering_limits`: 15% reduction
  - `workplace_closures`: 25% reduction

- Added **`apply_interventions()`** function:
  - Takes forecast points and active interventions
  - Reduces forecast values by effect percentage for active weeks
  - Uses multiplicative model (1.0 - effect) to avoid over-reduction
  - Applies adjustment to point estimate and all confidence intervals
  - Ensures lower bounds don't go negative

- Refactored **`_generate_forecasts()`** helper:
  - Extracted shared forecast generation logic
  - Accepts optional `interventions` parameter
  - Applies interventions to ARIMA, SEIR, and Ensemble forecasts

- Updated **GET `/api/forecasts`**:
  - Maintains backward compatibility
  - Calls `_generate_forecasts()` without interventions

- Added **POST `/api/forecasts`**:
  - Accepts request body with interventions
  - Passes interventions to `_generate_forecasts()`
  - Returns intervention-adjusted forecasts

## How It Works

### User Flow:
1. User toggles intervention week buttons in InterventionPanel
2. `onChange` callback updates parent state
3. `useForecast` hook detects intervention state change
4. Hook calls `getForecasts()` with interventions array
5. Frontend API client sends POST request to `/api/forecasts`
6. Backend applies intervention effects to forecasts
7. Adjusted forecasts returned and displayed in chart
8. User can reference AI panel on right while experimenting

### Intervention Logic:
- Multiple interventions in same week use **maximum effect** (not cumulative, to be conservative)
- Effects are applied to all forecast statistics (point, 50%, 80%, 95%)
- Lower confidence bounds clamped to 0 (can't be negative)
- Intervention effects represent ~transmission reduction assumptions

## Testing Recommendations

1. **Frontend:**
   - Toggle individual interventions and verify chart updates
   - Toggle multiple interventions in same week - verify max effect applied
   - Toggle interventions across different weeks
   - Click "Clear All" to reset
   - Resize window to verify responsive layout
   - Verify AI panel is sticky and visible on right

2. **Backend:**
   - Test GET request (no interventions): `GET /api/forecasts?disease=flu&jurisdiction=USA`
   - Test POST with interventions: send valid intervention JSON
   - Verify forecast values decrease when interventions applied
   - Check confidence intervals scale proportionally

3. **Integration:**
   - Enable/disable AI panel with toggle
   - Change disease and jurisdiction while interventions active
   - Export data/PDF with active interventions
   - Switch between models while interventions active

## Files Modified
```
Frontend:
  ✓ src/components/dashboard/DashboardPage.tsx (refactored layout)
  ✓ src/components/dashboard/InterventionPanel.tsx (new)
  ✓ src/hooks/useForecast.ts (added interventions param)
  ✓ src/services/api.ts (added interventions support)
  ✓ src/services/types.ts (added intervention types)
  ✓ src/styles/dashboard.css (added intervention & layout styles)

Backend:
  ✓ models/base.py (added intervention models)
  ✓ routers/forecasts.py (added intervention logic & POST endpoint)
```

## Notes
- Interventions are sent to backend which applies percentage-based reductions
- This is a simplified epidemiological model - actual intervention effects depend on many factors
- The right-side AI panel can be toggled with Agent Toggle switch
- Sticky sidebar has max-height of 85vh to prevent overflow below fold
