/**
 * Control panel: disease radio buttons, jurisdiction dropdown, reset button.
 */

import type { Disease, Jurisdiction } from "../../services/types";

interface ControlPanelProps {
  disease: Disease;
  jurisdiction: string;
  jurisdictions: Jurisdiction[];
  onDiseaseChange: (d: Disease) => void;
  onJurisdictionChange: (j: string) => void;
  onReset: () => void;
}

export default function ControlPanel({
  disease,
  jurisdiction,
  jurisdictions,
  onDiseaseChange,
  onJurisdictionChange,
  onReset,
}: ControlPanelProps) {
  return (
    <section id="controls" className="control-panel">
      <h2 className="control-panel__title">Dashboard Controls</h2>

      <div className="control-panel__row">
        {/* Disease selector */}
        <fieldset className="control-panel__fieldset">
          <legend className="control-panel__legend">Disease</legend>
          <label className="control-panel__radio">
            <input
              type="radio"
              name="disease"
              value="flu"
              checked={disease === "flu"}
              onChange={() => onDiseaseChange("flu")}
            />
            Influenza
          </label>
          <label className="control-panel__radio">
            <input
              type="radio"
              name="disease"
              value="covid"
              checked={disease === "covid"}
              onChange={() => onDiseaseChange("covid")}
            />
            COVID-19
          </label>
        </fieldset>

        {/* Jurisdiction dropdown */}
        <div className="control-panel__field">
          <label htmlFor="jurisdiction" className="control-panel__label">
            Jurisdiction
          </label>
          <select
            id="jurisdiction"
            className="control-panel__select"
            value={jurisdiction}
            onChange={(e) => onJurisdictionChange(e.target.value)}
          >
            {jurisdictions.map((j) => (
              <option key={j.code} value={j.code}>
                {j.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button className="control-panel__reset" onClick={onReset}>
          RESET
        </button>
      </div>
    </section>
  );
}
