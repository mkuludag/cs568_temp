"""Agent advisory API routes.

POST /api/agents/analyze — runs the multi-agent panel on a scenario.
"""

from fastapi import APIRouter

from models.base import AgentScenario, AgentResponse
from agents.placeholder import run_all_agents

router = APIRouter()


@router.post("/agents/analyze", response_model=AgentResponse)
async def analyze_scenario(scenario: AgentScenario):
    """Run the multi-agent advisory panel on the given forecast scenario.

    This endpoint is the integration point for the real multi-agent module.
    Currently uses a placeholder that returns template-based responses.
    """
    return run_all_agents(scenario)
