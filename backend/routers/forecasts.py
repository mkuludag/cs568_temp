"""Forecast API routes.

GET /api/forecasts       — returns historical + forecast data for a given
                           disease, jurisdiction, and model set.
GET /api/jurisdictions   — returns list of available jurisdictions.
"""

import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Query, HTTPException

from config import JURISDICTIONS, FORECAST_HORIZON
from data.cdc_loader import get_historical_data
from models.base import ForecastResult, WeeklyObservation
from models.arima_model import run_arima
from models.seir_model import run_seir
from models.ensemble import run_ensemble

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/jurisdictions")
async def list_jurisdictions():
    """Return all available jurisdictions."""
    return [
        {"code": code, "name": name}
        for code, name in sorted(JURISDICTIONS.items(), key=lambda x: x[1])
    ]


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
