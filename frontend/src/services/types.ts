/* ===== TypeScript types mirroring backend Pydantic schemas ===== */

export interface WeeklyObservation {
  week_end: string; // ISO date
  admissions: number;
  admissions_per100k?: number;
}

export interface ForecastPoint {
  week_end: string;
  point: number;
  lower_95: number;
  upper_95: number;
  lower_80: number;
  upper_80: number;
  lower_50: number;
  upper_50: number;
}

export interface ForecastResult {
  model: "arima" | "seir" | "ensemble";
  disease: "flu" | "covid";
  jurisdiction: string;
  history: WeeklyObservation[];
  forecasts: ForecastPoint[];
}

export interface Jurisdiction {
  code: string;
  name: string;
}

export interface AgentOutput {
  role: string;
  analysis: string;
}

export interface AgentResponse {
  epi: AgentOutput;
  healthcare: AgentOutput;
  economist: AgentOutput;
  consensus: AgentOutput;
}

export interface AgentScenario {
  disease: string;
  location: string;
  current_week_admissions: number;
  four_week_trend: "increasing" | "decreasing" | "stable";
  percent_change: number;
  forecast_summary: string;
}

/** Merged row for the chart: one per week across all models */
export interface ChartDataRow {
  [key: string]: string | number | undefined;
  week_end: string;
  // Historical (shared across models)
  historical?: number;
  // Per-model forecast columns
  arima_point?: number;
  arima_lower_95?: number;
  arima_upper_95?: number;
  arima_lower_80?: number;
  arima_upper_80?: number;
  arima_lower_50?: number;
  arima_upper_50?: number;
  seir_point?: number;
  seir_lower_95?: number;
  seir_upper_95?: number;
  seir_lower_80?: number;
  seir_upper_80?: number;
  seir_lower_50?: number;
  seir_upper_50?: number;
  ensemble_point?: number;
  ensemble_lower_95?: number;
  ensemble_upper_95?: number;
  ensemble_lower_80?: number;
  ensemble_upper_80?: number;
  ensemble_lower_50?: number;
  ensemble_upper_50?: number;
}

export type Disease = "flu" | "covid";
export type ModelName = "arima" | "seir" | "ensemble";

/** Colors matching CDC/USWDS palette */
export const MODEL_COLORS: Record<ModelName, string> = {
  arima: "#2378c3",
  seir: "#e66f0e",
  ensemble: "#2e8540",
};

export const DISEASE_LABELS: Record<Disease, string> = {
  flu: "Influenza",
  covid: "COVID-19",
};

/* ===== Intervention Types ===== */
export interface InterventionWeekState {
  week: 1 | 2 | 3 | 4;
  active: boolean;
}

export interface InterventionState {
  type: InterventionType;
  enabled: boolean;
  weeks: InterventionWeekState[];
}

export type InterventionType =
  | "school_closures"
  | "masking_mandates"
  | "transportation_restrictions"
  | "gathering_limits"
  | "workplace_closures";

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  school_closures: "School Closures",
  masking_mandates: "Masking Mandates",
  transportation_restrictions: "Transportation Restrictions",
  gathering_limits: "Gathering Limits",
  workplace_closures: "Workplace Closures",
};

export const INTERVENTION_DESCRIPTIONS: Record<InterventionType, string> = {
  school_closures: "Closure of educational institutions",
  masking_mandates: "Required mask wearing in public spaces",
  transportation_restrictions: "Limitations on public transportation",
  gathering_limits: "Restrictions on public gatherings and events",
  workplace_closures: "Closure or restrictions on non-essential workplaces",
};
