"""Ensemble model: weighted average of ARIMA and SEIR quantile forecasts.

Combines prediction intervals from both models to produce a blended
forecast with tighter uncertainty bands.
"""

import logging
from datetime import timedelta

from config import FORECAST_HORIZON, ENSEMBLE_WEIGHTS
from models.base import WeeklyObservation, ForecastPoint

logger = logging.getLogger(__name__)


def run_ensemble(
    arima_forecasts: list[ForecastPoint],
    seir_forecasts: list[ForecastPoint],
    weights: dict[str, float] | None = None,
) -> list[ForecastPoint]:
    """Produce ensemble forecasts by weighted-averaging ARIMA and SEIR quantiles.

    If one model failed (empty list), uses the other model at 100% weight.
    """
    w = weights or ENSEMBLE_WEIGHTS
    w_arima = w.get("arima", 0.5)
    w_seir = w.get("seir", 0.5)

    # Handle missing models
    if not arima_forecasts and not seir_forecasts:
        raise ValueError("Both ARIMA and SEIR produced no forecasts")

    if not arima_forecasts:
        logger.warning("ARIMA unavailable — ensemble = 100%% SEIR")
        return seir_forecasts

    if not seir_forecasts:
        logger.warning("SEIR unavailable — ensemble = 100%% ARIMA")
        return arima_forecasts

    horizon = min(len(arima_forecasts), len(seir_forecasts))
    forecasts = []

    for i in range(horizon):
        a = arima_forecasts[i]
        s = seir_forecasts[i]

        def blend(a_val: float, s_val: float) -> float:
            return round(max(0, w_arima * a_val + w_seir * s_val), 1)

        forecasts.append(
            ForecastPoint(
                week_end=a.week_end,  # both should have same date
                point=blend(a.point, s.point),
                lower_95=blend(a.lower_95, s.lower_95),
                upper_95=blend(a.upper_95, s.upper_95),
                lower_80=blend(a.lower_80, s.lower_80),
                upper_80=blend(a.upper_80, s.upper_80),
                lower_50=blend(a.lower_50, s.lower_50),
                upper_50=blend(a.upper_50, s.upper_50),
            )
        )

    return forecasts
