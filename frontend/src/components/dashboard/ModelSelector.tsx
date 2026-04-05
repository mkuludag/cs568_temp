/**
 * Model selector: checkboxes to toggle ARIMA, SEIR, Ensemble visibility.
 */

import type { ModelName } from "../../services/types";
import { MODEL_COLORS } from "../../services/types";

interface ModelSelectorProps {
  activeModels: ModelName[];
  onChange: (models: ModelName[]) => void;
}

const ALL_MODELS: { key: ModelName; label: string }[] = [
  { key: "arima", label: "ARIMA" },
  { key: "seir", label: "SEIR" },
  { key: "ensemble", label: "Ensemble" },
];

export default function ModelSelector({
  activeModels,
  onChange,
}: ModelSelectorProps) {
  const toggle = (model: ModelName) => {
    if (activeModels.includes(model)) {
      // Don't allow deselecting all
      if (activeModels.length > 1) {
        onChange(activeModels.filter((m) => m !== model));
      }
    } else {
      onChange([...activeModels, model]);
    }
  };

  return (
    <div className="model-selector">
      <span className="model-selector__label">Models:</span>
      {ALL_MODELS.map((m) => (
        <label
          key={m.key}
          className="model-selector__checkbox"
          style={{
            borderLeftColor: MODEL_COLORS[m.key],
          }}
        >
          <input
            type="checkbox"
            checked={activeModels.includes(m.key)}
            onChange={() => toggle(m.key)}
          />
          <span
            className="model-selector__dot"
            style={{ backgroundColor: MODEL_COLORS[m.key] }}
          />
          {m.label}
        </label>
      ))}
    </div>
  );
}
