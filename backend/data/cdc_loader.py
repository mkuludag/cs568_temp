"""Fetch weekly hospital admission data from CDC NHSN Socrata API.

Falls back to mock data if the API is unreachable.
"""

from datetime import date, timedelta
import logging

import httpx
import pandas as pd

from config import CDC_API_BASE, CDC_API_TIMEOUT, HISTORY_WEEKS
from models.base import WeeklyObservation

logger = logging.getLogger(__name__)

# Column mapping: disease -> (admissions column, per-100k column)
DISEASE_COLUMNS = {
    "flu": ("totalconfflunewadm", "totalconfflunewadmper100k"),
    "covid": ("totalconfc19newadm", "totalconfc19newadmper100k"),
}


async def fetch_cdc_data(
    disease: str,
    jurisdiction: str = "USA",
    weeks: int = HISTORY_WEEKS,
) -> list[WeeklyObservation]:
    """Fetch historical weekly admissions from CDC NHSN API.

    Returns a list of WeeklyObservation sorted by date ascending.
    Raises on failure so caller can fall back to mock data.
    """
    adm_col, per100k_col = DISEASE_COLUMNS[disease]

    params = {
        "$where": f"jurisdiction='{jurisdiction}'",
        "$select": f"weekendingdate, {adm_col}, {per100k_col}",
        "$order": "weekendingdate DESC",
        "$limit": str(weeks),
    }

    async with httpx.AsyncClient(timeout=CDC_API_TIMEOUT) as client:
        resp = await client.get(CDC_API_BASE, params=params)
        resp.raise_for_status()
        rows = resp.json()

    if not rows:
        raise ValueError(f"No data returned for {disease}/{jurisdiction}")

    observations: list[WeeklyObservation] = []
    for row in rows:
        try:
            week_end = date.fromisoformat(row["weekendingdate"][:10])
            admissions = float(row.get(adm_col) or 0)
            per100k = float(row.get(per100k_col) or 0) if row.get(per100k_col) else None
            observations.append(
                WeeklyObservation(
                    week_end=week_end,
                    admissions=admissions,
                    admissions_per100k=per100k,
                )
            )
        except (KeyError, ValueError, TypeError) as exc:
            logger.warning("Skipping malformed row: %s (%s)", row, exc)

    # Sort ascending by date
    observations.sort(key=lambda o: o.week_end)
    return observations


async def get_historical_data(
    disease: str,
    jurisdiction: str = "USA",
    weeks: int = HISTORY_WEEKS,
) -> list[WeeklyObservation]:
    """Get historical data, falling back to mock if CDC API fails."""
    try:
        data = await fetch_cdc_data(disease, jurisdiction, weeks)
        if data:
            logger.info(
                "Loaded %d weeks of %s data for %s from CDC API",
                len(data),
                disease,
                jurisdiction,
            )
            return data
    except Exception as exc:
        logger.warning(
            "CDC API failed for %s/%s: %s — using mock data", disease, jurisdiction, exc
        )

    # Fall back to mock data
    from data.mock_data import generate_mock_data

    return generate_mock_data(disease, jurisdiction, weeks)
