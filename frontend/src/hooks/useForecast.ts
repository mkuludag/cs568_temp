import { useState, useEffect, useCallback } from "react";
import { getForecasts } from "../services/api";
import type { ForecastResult, Disease, ModelName, ChartDataRow } from "../services/types";

interface UseForecastReturn {
  results: ForecastResult[];
  chartData: ChartDataRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Merge multiple ForecastResults into a single chart-ready dataset */
function buildChartData(results: ForecastResult[]): ChartDataRow[] {
  if (results.length === 0) return [];

  const rowMap = new Map<string, ChartDataRow>();

  // Historical data (same across all models — take from first result)
  const first = results[0];
  for (const obs of first.history) {
    rowMap.set(obs.week_end, {
      week_end: obs.week_end,
      historical: obs.admissions,
    });
  }

  // Forecast data per model
  for (const r of results) {
    for (const fc of r.forecasts) {
      const existing = rowMap.get(fc.week_end) || { week_end: fc.week_end } as ChartDataRow;
      const m = r.model;
      existing[`${m}_point`] = fc.point;
      existing[`${m}_lower_95`] = fc.lower_95;
      existing[`${m}_upper_95`] = fc.upper_95;
      existing[`${m}_lower_80`] = fc.lower_80;
      existing[`${m}_upper_80`] = fc.upper_80;
      existing[`${m}_lower_50`] = fc.lower_50;
      existing[`${m}_upper_50`] = fc.upper_50;
      rowMap.set(fc.week_end, existing);
    }
  }

  // Sort by date
  return Array.from(rowMap.values()).sort(
    (a, b) => a.week_end.localeCompare(b.week_end)
  );
}

export function useForecast(
  disease: Disease,
  jurisdiction: string,
  models: ModelName[]
): UseForecastReturn {
  const [results, setResults] = useState<ForecastResult[]>([]);
  const [chartData, setChartData] = useState<ChartDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelsKey = models.sort().join(",");

  const refetch = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getForecasts(disease, jurisdiction, models)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setChartData(buildChartData(data));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disease, jurisdiction, modelsKey]);

  useEffect(() => {
    const cleanup = refetch();
    return cleanup;
  }, [refetch]);

  return { results, chartData, loading, error, refetch };
}
