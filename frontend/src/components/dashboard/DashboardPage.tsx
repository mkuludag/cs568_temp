/**
 * Main dashboard page — orchestrates all dashboard sections.
 */

import { useState, useEffect, useCallback } from "react";
import { getJurisdictions } from "../../services/api";
import type {
  Disease,
  ModelName,
  Jurisdiction,
  InterventionState,
  InterventionType,
} from "../../services/types";

import { useForecast } from "../../hooks/useForecast";
/* Disabled for benchmark version - no AI analysis */
// import { useAgents } from "../../hooks/useAgents";

import ControlPanel from "./ControlPanel";
import ModelSelector from "./ModelSelector";
import SummaryCards from "./SummaryCards";
import ForecastChart from "../dashboard/ForecastChart";
import InterventionPanel from "./InterventionPanel";
import MapView from "./MapView";
import DataTable from "./DataTable";
import ExportTools from "./ExportTools";

/* Disabled for benchmark version - no AI advisory panel */
/* import AgentToggle from "../agents/AgentToggle";
import AgentPanel from "../agents/AgentPanel"; */

const DEFAULT_INTERVENTIONS: InterventionState[] = [
  "school_closures",
  "masking_mandates",
  "transportation_restrictions",
  "gathering_limits",
  "workplace_closures",
].map((type) => ({
  type: type as InterventionType,
  enabled: false,
  weeks: [
    { week: 1 as const, active: false },
    { week: 2 as const, active: false },
    { week: 3 as const, active: false },
    { week: 4 as const, active: false },
  ],
}));

const DEFAULT_DISEASE: Disease = "flu";
const DEFAULT_JURISDICTION = "USA";
const DEFAULT_MODELS: ModelName[] = ["arima", "seir", "ensemble"];

export default function DashboardPage() {
  const [disease, setDisease] = useState<Disease>(DEFAULT_DISEASE);
  const [jurisdiction, setJurisdiction] = useState(DEFAULT_JURISDICTION);
  const [activeModels, setActiveModels] = useState<ModelName[]>(DEFAULT_MODELS);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  // const [agentsEnabled, setAgentsEnabled] = useState(true); // Disabled for benchmark version
  const [interventions, setInterventions] = useState<InterventionState[]>(DEFAULT_INTERVENTIONS);

  const {
    results,
    chartData,
    loading,
    error,
  } = useForecast(
    disease,
    jurisdiction,
    activeModels,
    interventions
  );

  /* Disabled for benchmark version - no agent analysis */
  // const {
  //   response: agentResponse,
  //   loading: agentLoading,
  //   error: agentError,
  //   analyze,
  // } = useAgents();

  // Load jurisdictions on mount
  useEffect(() => {
    getJurisdictions()
      .then(setJurisdictions)
      .catch(() => {
        // Fallback: just USA
        setJurisdictions([{ code: "USA", name: "United States (National)" }]);
      });
  }, []);
  /* Disabled for benchmark version - no agent analysis */
  // Trigger agent analysis when enabled and forecast data changes
  // useEffect(() => {
  //   if (!agentsEnabled || results.length === 0) return;

  //   const first = results[0];
  //   const history = first.history;
  //   if (history.length < 5) return;

  //   const latest = history[history.length - 1];
  //   const fourAgo = history[history.length - 5];
  //   const pctChange =
  //     fourAgo.admissions > 0
  //       ? ((latest.admissions - fourAgo.admissions) / fourAgo.admissions) * 100
  //       : 0;

  //   const trend: "increasing" | "decreasing" | "stable" =
  //     pctChange > 10 ? "increasing" : pctChange < -10 ? "decreasing" : "stable";

  //   const ensemble = results.find((r) => r.model === "ensemble") || results[0];
  //   const forecastSummary =
  //     ensemble.forecasts.length > 0
  //       ? `admissions are expected to ${
  //           ensemble.forecasts[ensemble.forecasts.length - 1].point >
  //           latest.admissions
  //             ? "increase"
  //             : "decrease"
  //         } over the next 4 weeks.`
  //       : "forecast data unavailable.";

  //   const scenario: AgentScenario = {
  //     disease,
  //     location: jurisdiction,
  //     current_week_admissions: latest.admissions,
  //     four_week_trend: trend,
  //     percent_change: pctChange,
  //     forecast_summary: forecastSummary,
  //   };

  //   analyze(scenario);
  // }, [agentsEnabled, results, disease, jurisdiction, analyze]);

  const handleReset = useCallback(() => {
    setDisease(DEFAULT_DISEASE);
    setJurisdiction(DEFAULT_JURISDICTION);
    setActiveModels(DEFAULT_MODELS);
    // setAgentsEnabled(false); // Disabled for benchmark version
    setInterventions(DEFAULT_INTERVENTIONS);
  }, []);

  // Determine forecast start date (first date that has a forecast point)
  const forecastStartDate =
    results.length > 0 && results[0].forecasts.length > 0
      ? results[0].forecasts[0].week_end
      : undefined;

  return (
    <div className="dashboard">
      <ControlPanel
        disease={disease}
        jurisdiction={jurisdiction}
        jurisdictions={jurisdictions}
        onDiseaseChange={setDisease}
        onJurisdictionChange={setJurisdiction}
        onReset={handleReset}
      />

      <ModelSelector activeModels={activeModels} onChange={setActiveModels} />

      {/* AI Advisory Panel disabled for benchmark version */}
      {/* <AgentToggle enabled={agentsEnabled} onToggle={setAgentsEnabled} /> */}

      {loading && <div className="dashboard__loading">Loading forecast data...</div>}
      {error && <div className="dashboard__error">Error: {error}</div>}

      {!loading && !error && (
        <div className="dashboard-container">
          {/* Main content area */}
          <div className="dashboard-main">
            <SummaryCards results={results} />

            <ForecastChart
              data={chartData}
              activeModels={activeModels}
              forecastStartDate={forecastStartDate}
            />

            <InterventionPanel
              interventions={interventions}
              onChange={setInterventions}
            />

            <ExportTools
              results={results}
              disease={disease}
              jurisdiction={jurisdiction}
            />

            <MapView
              disease={disease}
              onStateClick={(code) => setJurisdiction(code)}
            />

            <DataTable results={results} activeModels={activeModels} />
          </div>

          {/* Right sidebar: AI Advisory Panel - disabled for benchmark version */}
          {/* {agentsEnabled && (
            <div className="dashboard-sidebar">
              <AgentPanel
                response={agentResponse}
                loading={agentLoading}
                error={agentError}
              />
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}
