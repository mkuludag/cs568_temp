"""Pydantic schemas and shared types for forecast models."""

from datetime import date
from typing import Optional
from pydantic import BaseModel


class WeeklyObservation(BaseModel):
    """A single week of observed hospital admissions."""

    week_end: date
    admissions: float
    admissions_per100k: Optional[float] = None


class ForecastPoint(BaseModel):
    """A single forecast point with prediction intervals."""

    week_end: date
    point: float  # median / point estimate
    lower_95: float
    upper_95: float
    lower_80: float
    upper_80: float
    lower_50: float
    upper_50: float


class ForecastResult(BaseModel):
    """Complete result from one forecasting model."""

    model: str  # "arima", "seir", or "ensemble"
    disease: str  # "flu" or "covid"
    jurisdiction: str
    history: list[WeeklyObservation]
    forecasts: list[ForecastPoint]


class AgentOutput(BaseModel):
    """Output from a single advisory agent."""

    role: str
    analysis: str


class AgentResponse(BaseModel):
    """Full multi-agent advisory response."""

    epi: AgentOutput
    healthcare: AgentOutput
    economist: AgentOutput
    consensus: AgentOutput


class AgentScenario(BaseModel):
    """Input scenario for the multi-agent panel."""

    disease: str
    location: str
    current_week_admissions: float
    four_week_trend: str  # "increasing", "decreasing", "stable"
    percent_change: float
    forecast_summary: str

# ===== Intervention Types =====
class InterventionWeekState(BaseModel):
    """State of an intervention in a specific week."""

    week: int  # 1-4
    active: bool


class InterventionState(BaseModel):
    """State of a specific intervention across 4 weeks."""

    type: str  # e.g., "school_closures", "masking_mandates", etc.
    enabled: bool = False  # Whether this intervention is enabled
    weeks: list[InterventionWeekState]


class InterventionsRequest(BaseModel):
    """Request body containing interventions."""

    interventions: list[InterventionState]