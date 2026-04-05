"""Generate synthetic hospital admission data when CDC API is unavailable."""

from datetime import date, timedelta
import numpy as np

from models.base import WeeklyObservation


def _seasonal_pattern(week_of_year: int, disease: str) -> float:
    """Return a seasonal multiplier (0-1) for the given epidemiological week."""
    if disease == "flu":
        # Peak around week 5 (late Jan / early Feb), trough around week 30
        return 0.5 * (1 + np.cos(2 * np.pi * (week_of_year - 5) / 52))
    else:
        # COVID: milder seasonality, slight winter bump
        return 0.3 * (1 + np.cos(2 * np.pi * (week_of_year - 2) / 52)) + 0.4


def generate_mock_data(
    disease: str,
    jurisdiction: str = "USA",
    weeks: int = 52,
) -> list[WeeklyObservation]:
    """Generate plausible synthetic weekly admission data.

    Uses a seasonal sinusoidal pattern with noise.
    National (USA) baseline is ~5000 flu / ~8000 covid per week at peak.
    State-level values are scaled down by ~1/50.
    """
    rng = np.random.default_rng(hash((disease, jurisdiction)) % 2**32)

    # Scale: national vs state-level
    if jurisdiction == "USA":
        base = 5000.0 if disease == "flu" else 8000.0
    else:
        base = 100.0 if disease == "flu" else 160.0

    today = date.today()
    # Most recent Saturday
    last_saturday = today - timedelta(days=(today.weekday() + 2) % 7)

    observations = []
    for i in range(weeks, 0, -1):
        week_end = last_saturday - timedelta(weeks=i - 1)
        iso_week = week_end.isocalendar()[1]
        seasonal = _seasonal_pattern(iso_week, disease)
        noise = rng.normal(1.0, 0.15)
        admissions = max(0, base * seasonal * noise)
        observations.append(
            WeeklyObservation(
                week_end=week_end,
                admissions=round(admissions, 1),
            )
        )

    return observations
