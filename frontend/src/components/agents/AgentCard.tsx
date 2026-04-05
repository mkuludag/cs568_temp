/**
 * Individual agent advisory card.
 */

import type { AgentOutput } from "../../services/types";

interface AgentCardProps {
  agent: AgentOutput;
  accentColor: string;
}

export default function AgentCard({ agent, accentColor }: AgentCardProps) {
  return (
    <div
      className="agent-card"
      style={{ borderLeftColor: accentColor }}
    >
      <h4 className="agent-card__role">{agent.role}</h4>
      <p className="agent-card__analysis">{agent.analysis}</p>
    </div>
  );
}
