/**
 * Agent panel: renders 3 agent cards + consensus view.
 */

import type { AgentResponse } from "../../services/types";
import AgentCard from "./AgentCard";
import ConsensusView from "./ConsensusView";

interface AgentPanelProps {
  response: AgentResponse | null;
  loading: boolean;
  error: string | null;
}

const AGENT_COLORS: Record<string, string> = {
  Epidemiologist: "#2378c3",
  "Healthcare Systems Analyst": "#e66f0e",
  "Health Economist": "#2e8540",
};

export default function AgentPanel({
  response,
  loading,
  error,
}: AgentPanelProps) {
  if (loading) {
    return (
      <section id="agents" className="agent-panel">
        <h2 className="section-title">AI Advisory Panel</h2>
        <div className="agent-panel__loading">Analyzing scenario...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="agents" className="agent-panel">
        <h2 className="section-title">AI Advisory Panel</h2>
        <div className="agent-panel__error">Error: {error}</div>
      </section>
    );
  }

  if (!response) return null;

  const agents = [response.epi, response.healthcare, response.economist];

  return (
    <section id="agents" className="agent-panel">
      <h2 className="section-title">AI Advisory Panel</h2>
      <div className="agent-panel__grid">
        {agents.map((agent) => (
          <AgentCard
            key={agent.role}
            agent={agent}
            accentColor={AGENT_COLORS[agent.role] || "#71767a"}
          />
        ))}
      </div>
      <ConsensusView consensus={response.consensus} />
    </section>
  );
}
