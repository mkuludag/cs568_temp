"""ARIMA forecasting model for hospital admissions.

Uses statsmodels SARIMAX with automatic order selection.
Produces point forecasts and prediction intervals at 50/80/95%.
"""

import logging
from datetime import timedelta

import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX

from config import FORECAST_HORIZON
from models.base import WeeklyObservation, ForecastPoint

logger = logging.getLogger(__name__)

# z-scores for prediction intervals
Z_SCORES = {
    50: 0.6745,
    80: 1.2816,
    95: 1.9600,
}


def run_arima(
    history: list[WeeklyObservation],
    horizon: int = FORECAST_HORIZON,
) -> list[ForecastPoint]:
    """Fit ARIMA model and produce h-step-ahead forecasts with intervals.

    Tries SARIMA(1,1,1)(1,0,1,52) first for seasonality.
    Falls back to ARIMA(2,1,2) if seasonal fit fails.
    """
    y = np.array([obs.admissions for obs in history], dtype=float)

    if len(y) < 10:
        raise ValueError("Need at least 10 observations for ARIMA")

    # Replace zeros/negatives with small positive (log-safe)
    y = np.maximum(y, 0.1)

    last_date = history[-1].week_end

    model = None
    fit = None

    # Try seasonal ARIMA first if enough data
    if len(y) >= 104:  # 2 years
        try:
            model = SARIMAX(
                y,
                order=(1, 1, 1),
                seasonal_order=(1, 0, 1, 52),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            fit = model.fit(disp=False, maxiter=200)
            logger.info("SARIMA(1,1,1)(1,0,1,52) converged")
        except Exception as exc:
            logger.warning("Seasonal ARIMA failed: %s", exc)
            fit = None

    # Fallback to simple ARIMA
    if fit is None:
        try:
            model = SARIMAX(
                y,
                order=(2, 1, 2),
                enforce_stationarity=False,
                enforce_invertibility=False,
            )
            fit = model.fit(disp=False, maxiter=200)
            logger.info("ARIMA(2,1,2) converged")
        except Exception as exc:
            logger.warning("ARIMA(2,1,2) failed: %s — using naive forecast", exc)
            return _naive_forecast(history, horizon)

    # Produce forecasts
    forecast_res = fit.get_forecast(steps=horizon)
    point_estimates = forecast_res.predicted_mean
    # Standard errors for intervals
    se = (
        np.sqrt(forecast_res.var_pred_mean)
        if hasattr(forecast_res, "var_pred_mean")
        else None
    )

    # Use summary_frame for intervals if SE not directly available
    try:
        summary = forecast_res.summary_frame(alpha=0.05)
        se_values = (
            summary["mean_ci_upper"].values - summary["mean_ci_lower"].values
        ) / (2 * Z_SCORES[95])
    except Exception:
        # Estimate SE from prediction intervals
        se_values = np.full(horizon, np.std(y[-12:]) if len(y) >= 12 else np.std(y))

    forecasts = []
    for i in range(horizon):
        week_end = last_date + timedelta(weeks=i + 1)
        pt = max(0, float(point_estimates[i]))
        se_i = float(se_values[i]) if i < len(se_values) else float(se_values[-1])

        forecasts.append(
            ForecastPoint(
                week_end=week_end,
                point=round(pt, 1),
                lower_95=round(max(0, pt - Z_SCORES[95] * se_i), 1),
                upper_95=round(max(0, pt + Z_SCORES[95] * se_i), 1),
                lower_80=round(max(0, pt - Z_SCORES[80] * se_i), 1),
                upper_80=round(max(0, pt + Z_SCORES[80] * se_i), 1),
                lower_50=round(max(0, pt - Z_SCORES[50] * se_i), 1),
                upper_50=round(max(0, pt + Z_SCORES[50] * se_i), 1),
            )
        )

    return forecasts


def _naive_forecast(
    history: list[WeeklyObservation],
    horizon: int,
) -> list[ForecastPoint]:
    """Last-value-carried-forward fallback with expanding variance."""
    recent = [obs.admissions for obs in history[-8:]]
    pt = float(np.mean(recent))
    sd = float(np.std(recent)) if len(recent) > 1 else pt * 0.1
    last_date = history[-1].week_end

    forecasts = []
    for i in range(horizon):
        week_end = last_date + timedelta(weeks=i + 1)
        spread = sd * np.sqrt(i + 1)  # growing uncertainty
        forecasts.append(
            ForecastPoint(
                week_end=week_end,
                point=round(pt, 1),
                lower_95=round(max(0, pt - Z_SCORES[95] * spread), 1),
                upper_95=round(pt + Z_SCORES[95] * spread, 1),
                lower_80=round(max(0, pt - Z_SCORES[80] * spread), 1),
                upper_80=round(pt + Z_SCORES[80] * spread, 1),
                lower_50=round(max(0, pt - Z_SCORES[50] * spread), 1),
                upper_50=round(pt + Z_SCORES[50] * spread, 1),
            )
        )

    return forecasts
