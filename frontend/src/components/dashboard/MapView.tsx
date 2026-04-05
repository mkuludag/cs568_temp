/**
 * US choropleth map showing latest admissions by state.
 * Uses react-simple-maps with US Atlas TopoJSON.
 */

import { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

import type { Disease } from "../../services/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface MapViewProps {
  disease: Disease;
  onStateClick: (stateCode: string) => void;
}

// State FIPS -> abbreviation mapping (subset — full map would be large)
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

interface StateData {
  [stateCode: string]: number;
}

export default function MapView({ disease, onStateClick }: MapViewProps) {
  const [stateData, setStateData] = useState<StateData>({});
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Fetch state-level latest data
  useEffect(() => {
    const fetchStateData = async () => {
      try {
        const col =
          disease === "flu"
            ? "totalconfflunewadmper100k"
            : "totalconfc19newadmper100k";
        const url = `https://data.cdc.gov/resource/mpgq-jmmr.json?$select=jurisdiction,${col}&$order=weekendingdate DESC&$limit=60&$where=weekendingdate>'2025-01-01'`;
        const res = await fetch(url);
        const rows = await res.json();

        const latest: StateData = {};
        for (const row of rows) {
          const code = row.jurisdiction;
          if (code && row[col] && !latest[code]) {
            latest[code] = parseFloat(row[col]);
          }
        }
        setStateData(latest);
      } catch {
        // Map will show without color coding
      }
    };

    fetchStateData();
  }, [disease]);

  const maxVal = Math.max(...Object.values(stateData), 1);

  const getColor = (stateCode: string): string => {
    const val = stateData[stateCode];
    if (val === undefined) return "#e0e0e0";
    const intensity = Math.min(val / maxVal, 1);
    // Blue scale for flu, red scale for covid
    if (disease === "flu") {
      const r = Math.round(235 - intensity * 200);
      const g = Math.round(240 - intensity * 200);
      const b = Math.round(250 - intensity * 50);
      return `rgb(${r},${g},${b})`;
    } else {
      const r = Math.round(250 - intensity * 50);
      const g = Math.round(235 - intensity * 200);
      const b = Math.round(235 - intensity * 200);
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <section id="map" className="map-view">
      <h2 className="section-title">
        Geographic Distribution — Admissions per 100k
      </h2>
      <div className="map-view__container">
        <ComposableMap projection="geoAlbersUsa" width={800} height={500}>
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = geo.id as string;
                  const stateCode = FIPS_TO_STATE[fips] || "";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getColor(stateCode)}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#ffd700", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={() => setHoveredState(stateCode)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => {
                        if (stateCode) onStateClick(stateCode);
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {hoveredState && (
          <div className="map-view__tooltip">
            <strong>{hoveredState}</strong>
            {stateData[hoveredState] !== undefined && (
              <span>: {stateData[hoveredState].toFixed(2)} per 100k</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
