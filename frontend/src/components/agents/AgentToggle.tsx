/**
 * ON/OFF toggle for the AI advisory panel.
 */

interface AgentToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AgentToggle({ enabled, onToggle }: AgentToggleProps) {
  return (
    <div className="agent-toggle">
      <label className="agent-toggle__label">
        <span className="agent-toggle__text">AI Advisory Panel</span>
        <div
          className={`agent-toggle__switch ${enabled ? "agent-toggle__switch--on" : ""}`}
          onClick={() => onToggle(!enabled)}
          role="switch"
          aria-checked={enabled}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onToggle(!enabled);
          }}
        >
          <div className="agent-toggle__knob" />
        </div>
        <span className="agent-toggle__state">
          {enabled ? "ON" : "OFF"}
        </span>
      </label>
    </div>
  );
}
