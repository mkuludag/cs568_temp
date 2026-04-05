/**
 * Data table: shows forecast values in tabular form with scroll.
 */

import type { ForecastResult, ModelName } from "../../services/types";
import { MODEL_COLORS } from "../../services/types";

interface DataTableProps {
  results: ForecastResult[];
  activeModels: ModelName[];
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function DataTable({ results, activeModels }: DataTableProps) {
  const filtered = results.filter((r) =>
    activeModels.includes(r.model as ModelName)
  );

  if (filtered.length === 0) return null;

  return (
    <section id="data" className="data-table">
      <h2 className="section-title">Forecast Data</h2>
      <div className="data-table__scroll">
        <table className="data-table__table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Week Ending</th>
              <th>Point Forecast</th>
              <th>50% PI</th>
              <th>80% PI</th>
              <th>95% PI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.flatMap((r) =>
              r.forecasts.map((fc, i) => (
                <tr key={`${r.model}-${i}`}>
                  {i === 0 ? (
                    <td
                      rowSpan={r.forecasts.length}
                      style={{
                        borderLeft: `4px solid ${MODEL_COLORS[r.model as ModelName]}`,
                        fontWeight: 600,
                      }}
                    >
                      {r.model.toUpperCase()}
                    </td>
                  ) : null}
                  <td>{fc.week_end}</td>
                  <td>{fmt(fc.point)}</td>
                  <td>
                    [{fmt(fc.lower_50)} – {fmt(fc.upper_50)}]
                  </td>
                  <td>
                    [{fmt(fc.lower_80)} – {fmt(fc.upper_80)}]
                  </td>
                  <td>
                    [{fmt(fc.lower_95)} – {fmt(fc.upper_95)}]
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
