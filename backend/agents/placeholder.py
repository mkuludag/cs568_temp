"""Placeholder multi-agent advisory module.

This will be replaced by teammates' OpenAI-powered multi-agent system.
The swap point is the `run_all_agents(scenario)` function.

Interface contract:
  Input:  AgentScenario dict with keys:
          - disease, location, current_week_admissions,
          - four_week_trend, percent_change, forecast_summary
  Output: dict with keys: epi, healthcare, economist, consensus
          Each value has: role (str), analysis (str — 3 sentences)
"""

from models.base import AgentScenario, AgentOutput, AgentResponse


def run_all_agents(scenario: AgentScenario) -> AgentResponse:
    """Run all four advisory agents on the given scenario.

    PLACEHOLDER: Returns template-based responses.
    Replace this function body with the real OpenAI multi-agent module.
    """
    disease_label = "influenza" if scenario.disease == "flu" else "COVID-19"
    trend = scenario.four_week_trend
    pct = abs(scenario.percent_change)

    epi = AgentOutput(
        role="Epidemiologist",
        analysis=(
            f"Hospital admissions for {disease_label} in {scenario.location} are "
            f"currently {trend} with a {pct:.1f}% change over the past 4 weeks. "
            f"Based on the forecast, {scenario.forecast_summary} "
            f"Surveillance should be maintained at current levels with attention to "
            f"age-stratified hospitalization rates."
        ),
    )

    healthcare = AgentOutput(
        role="Healthcare Systems Analyst",
        analysis=(
            f"Current {disease_label} admission volume of {scenario.current_week_admissions:.0f} "
            f"per week suggests {'elevated' if trend == 'increasing' else 'manageable'} "
            f"hospital capacity utilization. "
            f"{'Surge planning protocols should be reviewed.' if trend == 'increasing' else 'Routine capacity planning is sufficient.'} "
            f"ICU bed availability and staffing ratios should be monitored over the next 4 weeks."
        ),
    )

    economist = AgentOutput(
        role="Health Economist",
        analysis=(
            f"The {trend} trend in {disease_label} hospitalizations represents "
            f"{'growing' if trend == 'increasing' else 'stable'} economic burden on the healthcare system. "
            f"At current rates, estimated weekly direct hospitalization costs are "
            f"{'above' if trend == 'increasing' else 'within'} seasonal baseline expectations. "
            f"Cost-effectiveness of expanded vaccination campaigns should be evaluated."
        ),
    )

    consensus = AgentOutput(
        role="Consensus",
        analysis=(
            f"The advisory panel agrees that {disease_label} activity in {scenario.location} "
            f"is {trend} and warrants {'heightened' if trend == 'increasing' else 'continued'} "
            f"monitoring. "
            f"Key recommendation: {'Activate preparedness protocols and increase public health messaging.' if trend == 'increasing' else 'Maintain current surveillance and response posture.'} "
            f"The 4-week forecast suggests {scenario.forecast_summary}"
        ),
    )

    return AgentResponse(
        epi=epi,
        healthcare=healthcare,
        economist=economist,
        consensus=consensus,
    )
