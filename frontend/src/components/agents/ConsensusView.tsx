/**
 * Consensus card with gold accent — highlighted agent output.
 */

import type { AgentOutput } from "../../services/types";

interface ConsensusViewProps {
  consensus: AgentOutput;
}

export default function ConsensusView({ consensus }: ConsensusViewProps) {
  return (
    <div className="consensus-card">
      <div className="consensus-card__header">
        <span className="consensus-card__icon">&#9733;</span>
        <h4 className="consensus-card__title">{consensus.role}</h4>
      </div>
      <p className="consensus-card__analysis">{consensus.analysis}</p>
    </div>
  );
}
