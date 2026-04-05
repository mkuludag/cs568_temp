/**
 * Main dashboard page — orchestrates all dashboard sections.
 */

import { useState, useEffect, useCallback } from "react";
import { getJurisdictions } from "../../services/api";
import type {
  Disease,
  ModelName,
  Jurisdiction,
  AgentScenario,
} from "../../services/types";


import { useForecast } from "../../hooks/useForecast";
import { useAgents } from "../../hooks/useAgents";

import ControlPanel from "./ControlPanel";
import ModelSelector from "./ModelSelector";
import SummaryCards from "./SummaryCards";
import ForecastChart from "../dashboard/ForecastChart";
import MapView from "./MapView";
import DataTable from "./DataTable";
import ExportTools from "./ExportTools";

import AgentToggle from "../agents/AgentToggle";
import AgentPanel from "../agents/AgentPanel";

const DEFAULT_DISEASE: Disease = "flu";
const DEFAULT_JURISDICTION = "USA";
const DEFAULT_MODELS: ModelName[] = ["arima", "seir", "ensemble"];

export default function DashboardPage() {
  const [disease, setDisease] = useState<Disease>(DEFAULT_DISEASE);
  const [jurisdiction, setJurisdiction] = useState(DEFAULT_JURISDICTION);
  const [activeModels, setActiveModels] = useState<ModelName[]>(DEFAULT_MODELS);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [agentsEnabled, setAgentsEnabled] = useState(false);

  const { results, chartData, loading, error } = useForecast(
    disease,
    jurisdiction,
    activeModels
  );

  const {
    response: agentResponse,
    loading: agentLoading,
    error: agentError,
    analyze,
  } = useAgents();

  // Load jurisdictions on mount
  useEffect(() => {
    getJurisdictions()
      .then(setJurisdictions)
      .catch(() => {
        // Fallback: just USA
        setJurisdictions([{ code: "USA", name: "United States (National)" }]);
      });
  }, []);

  // Trigger agent analysis when enabled and forecast data changes
  useEffect(() => {
    if (!agentsEnabled || results.length === 0) return;

    const first = results[0];
    const history = first.history;
    if (history.length < 5) return;

    const latest = history[history.length - 1];
    const fourAgo = history[history.length - 5];
    const pctChange =
      fourAgo.admissions > 0
        ? ((latest.admissions - fourAgo.admissions) / fourAgo.admissions) * 100
        : 0;

    const trend: "increasing" | "decreasing" | "stable" =
      pctChange > 10 ? "increasing" : pctChange < -10 ? "decreasing" : "stable";

    const ensemble = results.find((r) => r.model === "ensemble") || results[0];
    const forecastSummary =
      ensemble.forecasts.length > 0
        ? `admissions are expected to ${
            ensemble.forecasts[ensemble.forecasts.length - 1].point >
            latest.admissions
              ? "increase"
              : "decrease"
          } over the next 4 weeks.`
        : "forecast data unavailable.";

    const scenario: AgentScenario = {
      disease,
      location: jurisdiction,
      current_week_admissions: latest.admissions,
      four_week_trend: trend,
      percent_change: pctChange,
      forecast_summary: forecastSummary,
    };

    analyze(scenario);
  }, [agentsEnabled, results, disease, jurisdiction, analyze]);

  const handleReset = useCallback(() => {
    setDisease(DEFAULT_DISEASE);
    setJurisdiction(DEFAULT_JURISDICTION);
    setActiveModels(DEFAULT_MODELS);
    setAgentsEnabled(false);
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

      <AgentToggle enabled={agentsEnabled} onToggle={setAgentsEnabled} />

      {loading && <div className="dashboard__loading">Loading forecast data...</div>}
      {error && <div className="dashboard__error">Error: {error}</div>}

      {!loading && !error && (
        <>
          <SummaryCards results={results} />

          <ForecastChart
            data={chartData}
            activeModels={activeModels}
            forecastStartDate={forecastStartDate}
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

          {agentsEnabled && (
            <AgentPanel
              response={agentResponse}
              loading={agentLoading}
              error={agentError}
            />
          )}
        </>
      )}
    </div>
  );
}
