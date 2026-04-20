/**
 * Intervention Panel: allows users to toggle interventions across 4 forecast weeks
 * Appears below the forecast chart to allow real-time scenario analysis
 */


import type {
  InterventionType,
  InterventionState,
} from "../../services/types";
import {
  INTERVENTION_LABELS,
  INTERVENTION_DESCRIPTIONS,
} from "../../services/types";



interface InterventionPanelProps {
  interventions: InterventionState[];
  onChange: (interventions: InterventionState[]) => void;
}

export default function InterventionPanel({
  interventions,
  onChange,
}: InterventionPanelProps) {
  const toggleInterventionEnabled = (interventionType: InterventionType) => {
    onChange(
      interventions.map((int) => {
        if (int.type === interventionType) {
          const nowEnabled = !int.enabled;
          return {
            ...int,
            enabled: nowEnabled,
            weeks: nowEnabled
              ? int.weeks
              : int.weeks.map((w) => ({ ...w, active: false })),
          };
        }
        return int;
      })
    );
  };

  const toggleWeek = (interventionType: InterventionType, week: 1 | 2 | 3 | 4) => {
    onChange(
      interventions.map((int) => {
        if (int.type === interventionType && int.enabled) {
          // Check if this week is already active
          const isCurrentlyActive = int.weeks.find(w => w.week === week)?.active;
          
          return {
            ...int,
            // If clicking an already-active week, deactivate it
            // Otherwise, deactivate all and activate only this week
            weeks: int.weeks.map((w) => ({
              ...w,
              active: isCurrentlyActive ? false : w.week === week,
            })),
          };
        }
        return int;
      })
    );
  };

  const clearAll = () => {
    onChange(
      interventions.map((int) => ({
        ...int,
        enabled: false,
        weeks: int.weeks.map((w) => ({ ...w, active: false })),
      }))
    );
  };

  const isAnyActive = interventions.some((int) => int.enabled);
  const activeWeekCount = interventions.reduce(
    (count, int) => count + (int.enabled ? int.weeks.filter((w) => w.active).length : 0),
    0
  );

  return (
    <section className="intervention-panel">
      <div className="intervention-panel__header">
        <div className="intervention-panel__title-row">
          <h3 className="intervention-panel__title">Public Health Interventions</h3>
          {isAnyActive && (
            <div className="intervention-panel__badge">
              {activeWeekCount} week{activeWeekCount !== 1 ? 's' : ''} active
            </div>
          )}
        </div>
        <p className="intervention-panel__subtitle">
          Select interventions to apply per week and see forecast impact
        </p>
        {isAnyActive && (
          <button
            type="button"
            className="intervention-panel__clear"
            onClick={clearAll}
            title="Clear all interventions"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="intervention-panel__grid">
        {interventions.map((intervention) => {
          const weeksActive = intervention.weeks.filter((w) => w.active).length;
          
          return (
            <div
              key={intervention.type}
              className={`intervention-card ${intervention.enabled ? "intervention-card--enabled" : ""}`}
            >
              <div className="intervention-card__header">
                <button
                  type="button"
                  className={`intervention-card__toggle ${intervention.enabled ? "intervention-card__toggle--active" : ""}`}
                  onClick={() => toggleInterventionEnabled(intervention.type)}
                  title={`${intervention.enabled ? "Disable" : "Enable"} ${INTERVENTION_LABELS[intervention.type]}`}
                  aria-pressed={intervention.enabled}
                >
                  <span className="intervention-card__toggle-dot" />
                </button>
                <div className="intervention-card__label">
                  <strong>{INTERVENTION_LABELS[intervention.type]}</strong>
                  {intervention.enabled && weeksActive > 0 && (
                    <span className="intervention-card__active-badge">
                      {weeksActive}w
                    </span>
                  )}
                  <span className="intervention-card__desc">
                    {INTERVENTION_DESCRIPTIONS[intervention.type]}
                  </span>
                </div>
              </div>

              <div className={`intervention-card__weeks ${intervention.enabled ? "" : "intervention-card__weeks--disabled"}`}>
                {intervention.weeks.map((weekState) => (
                  <button
                    type="button"
                    key={`${intervention.type}-w${weekState.week}`}
                    className={`intervention-week ${weekState.active ? "intervention-week--active" : ""}`}
                    onClick={() => toggleWeek(intervention.type, weekState.week)}
                    disabled={!intervention.enabled}
                    title={
                      intervention.enabled
                        ? `Toggle ${INTERVENTION_LABELS[intervention.type]} in week ${weekState.week}`
                        : `Enable intervention to select weeks`
                    }
                  >
                    W{weekState.week}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="intervention-panel__info">
        <p className="intervention-panel__note">
          💡 <strong>Note:</strong> Interventions are modeled against baseline
          forecasts. Actual transmission impact varies by disease, strain, and
          population compliance.
        </p>
      </div>
    </section>
  );
}
