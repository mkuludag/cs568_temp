/**
 * Forecast chart: Recharts time-series with confidence interval bands.
 *
 * Historical data shown as solid line.
 * Each model's forecast shown as dashed line + shaded 50/80/95% bands.
 * Vertical reference line at the forecast start date.
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

import type { ChartDataRow, ModelName } from "../../services/types";
import { MODEL_COLORS } from "../../services/types";

interface ForecastChartProps {
  data: ChartDataRow[];
  activeModels: ModelName[];
  forecastStartDate?: string;
}

/** Format date label for X axis */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ForecastChart({
  data,
  activeModels,
  forecastStartDate,
}: ForecastChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  // Only show last 26 weeks of history + forecasts for readability
  const forecastIdx = forecastStartDate
    ? data.findIndex((d) => d.week_end === forecastStartDate)
    : data.findIndex((d) =>
        activeModels.some(
          (m) => d[`${m}_point`] !== undefined
        )
      );

  const startIdx = Math.max(0, forecastIdx - 26);
  const visibleData = data.slice(startIdx);

  // Determine the forecast start date from data if not provided
  const refDate =
    forecastStartDate ||
    (forecastIdx >= 0 ? data[forecastIdx].week_end : undefined);

  return (
    <section id="forecast" className="forecast-chart">
      <h2 className="section-title">Hospital Admissions Forecast</h2>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={visibleData}
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="week_end"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => v.toLocaleString()}
            label={{
              value: "Admissions",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 },
            }}
          />
          <Tooltip
            labelFormatter={(label: string) => {
              const d = new Date(label + "T00:00:00");
              return d.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
            }}
            formatter={(value: number, name: string) => [
              value?.toLocaleString() ?? "N/A",
              name,
            ]}
          />
          <Legend />

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historical"
            name="Observed"
            stroke="#1b1b1b"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />

          {/* Forecast reference line */}
          {refDate && (
            <ReferenceLine
              x={refDate}
              stroke="#71767a"
              strokeDasharray="4 4"
              label={{
                value: "Forecast",
                position: "top",
                fill: "#71767a",
                fontSize: 11,
              }}
            />
          )}

          {/* Per-model bands and lines */}
          {activeModels.map((model) => {
            const color = MODEL_COLORS[model];
            return (
              <React.Fragment key={model}>
                {/* 95% CI band */}
                <Area
                  type="monotone"
                  dataKey={`${model}_upper_95`}
                  stroke="none"
                  fill={color}
                  fillOpacity={0.08}
                  name={`${model.toUpperCase()} 95% CI`}
                  legendType="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey={`${model}_lower_95`}
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name={`_${model}_lower95`}
                  legendType="none"
                  connectNulls={false}
                />

                {/* 80% CI band */}
                <Area
                  type="monotone"
                  dataKey={`${model}_upper_80`}
                  stroke="none"
                  fill={color}
                  fillOpacity={0.15}
                  name={`${model.toUpperCase()} 80% CI`}
                  legendType="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey={`${model}_lower_80`}
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name={`_${model}_lower80`}
                  legendType="none"
                  connectNulls={false}
                />

                {/* 50% CI band */}
                <Area
                  type="monotone"
                  dataKey={`${model}_upper_50`}
                  stroke="none"
                  fill={color}
                  fillOpacity={0.25}
                  name={`${model.toUpperCase()} 50% CI`}
                  legendType="none"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey={`${model}_lower_50`}
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name={`_${model}_lower50`}
                  legendType="none"
                  connectNulls={false}
                />

                {/* Point forecast line */}
                <Line
                  type="monotone"
                  dataKey={`${model}_point`}
                  name={`${model.toUpperCase()} Forecast`}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={false}
                />
              </React.Fragment>
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

// Need React for JSX fragments
import React from "react";
