/**
 * API client for the CS568 Forecast backend.
 */

import type {
  ForecastResult,
  Jurisdiction,
  AgentScenario,
  AgentResponse,
  Disease,
  ModelName,
} from "./types";

const API_BASE = "/api";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch list of available jurisdictions */
export async function getJurisdictions(): Promise<Jurisdiction[]> {
  return fetchJSON<Jurisdiction[]>(`${API_BASE}/jurisdictions`);
}

/** Fetch forecasts for a given disease, jurisdiction, and model set */
export async function getForecasts(
  disease: Disease,
  jurisdiction: string,
  models: ModelName[] = ["arima", "seir", "ensemble"]
): Promise<ForecastResult[]> {
  const params = new URLSearchParams({
    disease,
    jurisdiction,
    models: models.join(","),
  });
  return fetchJSON<ForecastResult[]>(`${API_BASE}/forecasts?${params}`);
}

/** Run the multi-agent advisory panel */
export async function analyzeScenario(
  scenario: AgentScenario
): Promise<AgentResponse> {
  return fetchJSON<AgentResponse>(`${API_BASE}/agents/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario),
  });
}
