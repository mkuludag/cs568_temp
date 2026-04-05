"""SEIR compartmental model with Monte Carlo uncertainty quantification.

Solves the classic S-E-I-R ODE system and maps the incidence curve to
weekly hospital admissions. Runs N Monte Carlo simulations with perturbed
parameters to produce prediction intervals.
"""

import logging
from datetime import timedelta

import numpy as np
from scipy.integrate import odeint

from config import FORECAST_HORIZON, SEIR_POPULATION, SEIR_MONTE_CARLO_RUNS
from models.base import WeeklyObservation, ForecastPoint

logger = logging.getLogger(__name__)


def _seir_odes(y, _t, beta, sigma, gamma):
    """SEIR differential equations."""
    S, E, I, R = y
    N = S + E + I + R
    dSdt = -beta * S * I / N
    dEdt = beta * S * I / N - sigma * E
    dIdt = sigma * E - gamma * I
    dRdt = gamma * I
    return [dSdt, dEdt, dIdt, dRdt]


def _estimate_parameters(history: list[WeeklyObservation], population: float):
    """Estimate SEIR parameters from recent admission trends.

    Returns dict with: beta, sigma, gamma, I0, E0, hospitalization_rate
    """
    recent = [obs.admissions for obs in history[-8:]]
    avg_recent = np.mean(recent)
    trend = (recent[-1] - recent[0]) / max(recent[0], 1) if recent[0] > 0 else 0

    # Epidemiological priors
    sigma = 1.0 / 3.0  # 3-day incubation (1/latent period)
    gamma = 1.0 / 7.0  # 7-day infectious period

    # Estimate R0 from trend: if admissions rising, R0 > 1
    if trend > 0.1:
        R0 = 1.3 + trend * 0.5
    elif trend < -0.1:
        R0 = 0.8 + (1 + trend) * 0.2
    else:
        R0 = 1.05

    R0 = np.clip(R0, 0.5, 3.0)
    beta = R0 * gamma

    # Hospitalization rate: fraction of infections requiring hospital
    hosp_rate = 0.02  # ~2% of infections hospitalized

    # Estimate current I from admissions: I ≈ admissions / (gamma * hosp_rate)
    I0 = avg_recent / (gamma * hosp_rate * 7)  # convert weekly to daily
    I0 = max(I0, 100)
    E0 = I0 * 1.5  # assume exposed > infectious
    R0_pop = population * 0.3  # 30% previously recovered/immune
    S0 = population - E0 - I0 - R0_pop

    return {
        "beta": beta,
        "sigma": sigma,
        "gamma": gamma,
        "S0": S0,
        "E0": E0,
        "I0": I0,
        "R0_pop": R0_pop,
        "hosp_rate": hosp_rate,
        "population": population,
    }


def _run_single_simulation(params: dict, horizon_days: int) -> np.ndarray:
    """Run one SEIR simulation, return daily new hospitalizations."""
    y0 = [params["S0"], params["E0"], params["I0"], params["R0_pop"]]
    t = np.arange(0, horizon_days + 1, 1)

    solution = odeint(
        _seir_odes, y0, t, args=(params["beta"], params["sigma"], params["gamma"])
    )
    S, E, I, R = solution.T

    # Daily new infections ≈ sigma * E(t)
    daily_new_infections = params["sigma"] * E[1:]
    daily_hospitalizations = daily_new_infections * params["hosp_rate"]

    return np.maximum(daily_hospitalizations, 0)


def run_seir(
    history: list[WeeklyObservation],
    horizon: int = FORECAST_HORIZON,
    population: float = SEIR_POPULATION,
    n_simulations: int = SEIR_MONTE_CARLO_RUNS,
) -> list[ForecastPoint]:
    """Run SEIR model with Monte Carlo parameter perturbation.

    Returns forecast points with quantile-based prediction intervals.
    """
    if len(history) < 4:
        raise ValueError("Need at least 4 weeks of history for SEIR")

    base_params = _estimate_parameters(history, population)
    horizon_days = horizon * 7
    last_date = history[-1].week_end

    rng = np.random.default_rng(42)

    # Monte Carlo: perturb beta, hosp_rate, I0
    weekly_totals = np.zeros((n_simulations, horizon))

    for sim in range(n_simulations):
        perturbed = base_params.copy()
        perturbed["beta"] *= rng.lognormal(0, 0.15)
        perturbed["hosp_rate"] *= rng.lognormal(0, 0.1)
        perturbed["I0"] *= rng.lognormal(0, 0.2)
        # Re-balance S0
        perturbed["S0"] = (
            perturbed["population"]
            - perturbed["E0"]
            - perturbed["I0"]
            - perturbed["R0_pop"]
        )

        try:
            daily = _run_single_simulation(perturbed, horizon_days)
            # Aggregate daily -> weekly
            for w in range(horizon):
                start = w * 7
                end = start + 7
                weekly_totals[sim, w] = np.sum(daily[start:end])
        except Exception:
            # Use NaN — will be excluded from quantiles
            weekly_totals[sim, :] = np.nan

    # Compute quantiles across simulations
    forecasts = []
    for w in range(horizon):
        week_end = last_date + timedelta(weeks=w + 1)
        vals = weekly_totals[:, w]
        vals = vals[~np.isnan(vals)]

        if len(vals) < 10:
            # Not enough valid sims — use base estimate
            pt = float(
                np.sum(
                    _run_single_simulation(base_params, horizon_days)[
                        w * 7 : (w + 1) * 7
                    ]
                )
            )
            forecasts.append(
                ForecastPoint(
                    week_end=week_end,
                    point=round(pt, 1),
                    lower_95=round(pt * 0.5, 1),
                    upper_95=round(pt * 1.5, 1),
                    lower_80=round(pt * 0.7, 1),
                    upper_80=round(pt * 1.3, 1),
                    lower_50=round(pt * 0.85, 1),
                    upper_50=round(pt * 1.15, 1),
                )
            )
        else:
            pt = float(np.median(vals))
            forecasts.append(
                ForecastPoint(
                    week_end=week_end,
                    point=round(pt, 1),
                    lower_95=round(max(0, float(np.percentile(vals, 2.5))), 1),
                    upper_95=round(float(np.percentile(vals, 97.5)), 1),
                    lower_80=round(max(0, float(np.percentile(vals, 10))), 1),
                    upper_80=round(float(np.percentile(vals, 90)), 1),
                    lower_50=round(max(0, float(np.percentile(vals, 25))), 1),
                    upper_50=round(float(np.percentile(vals, 75)), 1),
                )
            )

    return forecasts
