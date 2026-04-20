"""Forecast API routes.

GET /api/forecasts       — returns historical + forecast data for a given
                           disease, jurisdiction, and model set.
POST /api/forecasts      — with interventions in request body
GET /api/jurisdictions   — returns list of available jurisdictions.
"""

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Query, HTTPException

from config import JURISDICTIONS, FORECAST_HORIZON
from data.cdc_loader import get_historical_data
from models.base import ForecastResult, WeeklyObservation, InterventionsRequest, InterventionState
from models.arima_model import run_arima
from models.seir_model import run_seir
from models.ensemble import run_ensemble

logger = logging.getLogger(__name__)

router = APIRouter()

# Intervention effects (reduction in transmissions per week)
INTERVENTION_EFFECTS = {
    "school_closures": 0.20,
    "masking_mandates": 0.15,
    "transportation_restrictions": 0.10,
    "gathering_limits": 0.15,
    "workplace_closures": 0.25,
}


def apply_interventions(forecasts: list, interventions: list[InterventionState]) -> list:
    """Apply intervention adjustments to forecast points.
    
    Interventions reduce forecast values by approximately the effect percentage
    for each week where they are active.
    """
    if not interventions:
        return forecasts

    adjusted = []
    for point in forecasts:
        # Find which week this forecast point represents (1-4)
        # Assuming forecasts are in order starting from week 1
        forecast_week = len(adjusted) + 1
        if forecast_week > 4:
            adjusted.append(point)
            continue

        # Calculate combined reduction from all active interventions in this week
        total_reduction = 0.0
        for intervention in interventions:
            # Only process enabled interventions
            if not intervention.enabled:
                continue
                
            for week_state in intervention.weeks:
                if week_state.week == forecast_week and week_state.active:
                    effect = INTERVENTION_EFFECTS.get(intervention.type, 0.0)
                    total_reduction = max(total_reduction, effect)  # Use max to avoid over-reduction

        # Apply reduction to all forecast values
        if total_reduction > 0:
            multiplier = 1.0 - total_reduction
            adjusted_point = point.model_copy()
            adjusted_point.point = point.point * multiplier
            adjusted_point.lower_95 = max(0, point.lower_95 * multiplier)
            adjusted_point.upper_95 = point.upper_95 * multiplier
            adjusted_point.lower_80 = max(0, point.lower_80 * multiplier)
            adjusted_point.upper_80 = point.upper_80 * multiplier
            adjusted_point.lower_50 = max(0, point.lower_50 * multiplier)
            adjusted_point.upper_50 = point.upper_50 * multiplier
            adjusted.append(adjusted_point)
        else:
            adjusted.append(point)

    return adjusted


@router.get("/jurisdictions")
async def list_jurisdictions():
    """Return all available jurisdictions."""
    return [
        {"code": code, "name": name}
        for code, name in sorted(JURISDICTIONS.items(), key=lambda x: x[1])
    ]


async def _generate_forecasts(
    disease: str,
    jurisdiction: str,
    models: str,
    interventions: Optional[list[InterventionState]] = None,
) -> list[ForecastResult]:
    """Internal helper to generate forecasts with optional interventions."""
    if jurisdiction not in JURISDICTIONS:
        raise HTTPException(
            status_code=400, detail=f"Unknown jurisdiction: {jurisdiction}"
        )

    requested_models = [m.strip().lower() for m in models.split(",")]
    valid_models = {"arima", "seir", "ensemble"}
    for m in requested_models:
        if m not in valid_models:
            raise HTTPException(status_code=400, detail=f"Unknown model: {m}")

    # Fetch historical data
    history = await get_historical_data(disease, jurisdiction)

    if len(history) < 4:
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient data for {disease}/{jurisdiction}: only {len(history)} weeks",
        )

    # Run requested models
    arima_fc: list = []
    seir_fc: list = []
    results: list[ForecastResult] = []

    # Run ARIMA and SEIR concurrently if both are needed
    need_arima = "arima" in requested_models or "ensemble" in requested_models
    need_seir = "seir" in requested_models or "ensemble" in requested_models

    async def _run_arima():
        try:
            return run_arima(history)
        except Exception as exc:
            logger.error("ARIMA failed: %s", exc)
            return []

    async def _run_seir():
        try:
            return run_seir(history)
        except Exception as exc:
            logger.error("SEIR failed: %s", exc)
            return []

    if need_arima and need_seir:
        arima_fc, seir_fc = await asyncio.gather(_run_arima(), _run_seir())
    elif need_arima:
        arima_fc = await _run_arima()
    elif need_seir:
        seir_fc = await _run_seir()

    # Apply interventions if provided
    if interventions:
        arima_fc = apply_interventions(arima_fc, interventions)
        seir_fc = apply_interventions(seir_fc, interventions)

    if "arima" in requested_models and arima_fc:
        results.append(
            ForecastResult(
                model="arima",
                disease=disease,
                jurisdiction=jurisdiction,
                history=history,
                forecasts=arima_fc,
            )
        )

    if "seir" in requested_models and seir_fc:
        results.append(
            ForecastResult(
                model="seir",
                disease=disease,
                jurisdiction=jurisdiction,
                history=history,
                forecasts=seir_fc,
            )
        )

    if "ensemble" in requested_models:
        try:
            ens_fc = run_ensemble(arima_fc, seir_fc)
            results.append(
                ForecastResult(
                    model="ensemble",
                    disease=disease,
                    jurisdiction=jurisdiction,
                    history=history,
                    forecasts=ens_fc,
                )
            )
        except Exception as exc:
            logger.error("Ensemble failed: %s", exc)

    if not results:
        raise HTTPException(
            status_code=500, detail="All models failed to produce forecasts"
        )

    return results


@router.get("/forecasts", response_model=list[ForecastResult])
async def get_forecasts(
    disease: str = Query("flu", regex="^(flu|covid)$"),
    jurisdiction: str = Query("USA"),
    models: str = Query(
        "arima,seir,ensemble", description="Comma-separated model names"
    ),
):
    """Generate forecasts for the requested disease and jurisdiction.

    Returns a list of ForecastResult, one per requested model.
    Each includes both the historical series and forecast points.
    """
    return await _generate_forecasts(disease, jurisdiction, models, interventions=None)


@router.post("/forecasts", response_model=list[ForecastResult])
async def get_forecasts_with_interventions(
    disease: str = Query("flu", regex="^(flu|covid)$"),
    jurisdiction: str = Query("USA"),
    models: str = Query(
        "arima,seir,ensemble", description="Comma-separated model names"
    ),
    request: InterventionsRequest = None,
):
    """Generate forecasts with optional intervention adjustments.

    Request body can include interventions to adjust forecasts.
    """
    interventions = request.interventions if request else None
    return await _generate_forecasts(disease, jurisdiction, models, interventions=interventions)
