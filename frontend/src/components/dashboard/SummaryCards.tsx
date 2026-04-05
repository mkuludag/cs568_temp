/**
 * Summary cards showing key metrics from the most recent data.
 */

import type { ForecastResult } from "../../services/types";

interface SummaryCardsProps {
  results: ForecastResult[];
}

export default function SummaryCards({ results }: SummaryCardsProps) {
  if (results.length === 0) return null;

  const first = results[0];
  const history = first.history;

  if (history.length < 2) return null;

  const latest = history[history.length - 1];
  const prev = history[history.length - 2];
  const weekChange =
    prev.admissions > 0
      ? ((latest.admissions - prev.admissions) / prev.admissions) * 100
      : 0;

  // 4-week trend
  const fourWeeksAgo =
    history.length >= 5 ? history[history.length - 5] : history[0];
  const fourWeekChange =
    fourWeeksAgo.admissions > 0
      ? ((latest.admissions - fourWeeksAgo.admissions) /
          fourWeeksAgo.admissions) *
        100
      : 0;

  // Next week forecast (ensemble if available, else first model)
  const ensemble = results.find((r) => r.model === "ensemble");
  const forecastSource = ensemble || results[0];
  const nextWeek =
    forecastSource.forecasts.length > 0
      ? forecastSource.forecasts[0]
      : null;

  const cards = [
    {
      label: "Latest Week Admissions",
      value: latest.admissions.toLocaleString(),
      sub: latest.week_end,
    },
    {
      label: "Week-over-Week Change",
      value: `${weekChange >= 0 ? "+" : ""}${weekChange.toFixed(1)}%`,
      sub: weekChange > 5 ? "Increasing" : weekChange < -5 ? "Decreasing" : "Stable",
      className:
        weekChange > 5
          ? "card--danger"
          : weekChange < -5
          ? "card--success"
          : "",
    },
    {
      label: "4-Week Trend",
      value: `${fourWeekChange >= 0 ? "+" : ""}${fourWeekChange.toFixed(1)}%`,
      sub:
        fourWeekChange > 10
          ? "Increasing"
          : fourWeekChange < -10
          ? "Decreasing"
          : "Stable",
      className:
        fourWeekChange > 10
          ? "card--danger"
          : fourWeekChange < -10
          ? "card--success"
          : "",
    },
    {
      label: "Next Week Forecast",
      value: nextWeek ? nextWeek.point.toLocaleString() : "N/A",
      sub: nextWeek
        ? `${forecastSource.model.toUpperCase()} [${nextWeek.lower_95.toLocaleString()} – ${nextWeek.upper_95.toLocaleString()}]`
        : "",
    },
  ];

  return (
    <section id="summary" className="summary-cards">
      {cards.map((c, i) => (
        <div key={i} className={`summary-card ${c.className || ""}`}>
          <div className="summary-card__label">{c.label}</div>
          <div className="summary-card__value">{c.value}</div>
          <div className="summary-card__sub">{c.sub}</div>
        </div>
      ))}
    </section>
  );
}
