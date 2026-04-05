import { useState, useCallback } from "react";
import { analyzeScenario } from "../services/api";
import type { AgentScenario, AgentResponse } from "../services/types";

interface UseAgentsReturn {
  response: AgentResponse | null;
  loading: boolean;
  error: string | null;
  analyze: (scenario: AgentScenario) => void;
}

export function useAgents(): UseAgentsReturn {
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback((scenario: AgentScenario) => {
    setLoading(true);
    setError(null);

    analyzeScenario(scenario)
      .then((data) => setResponse(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { response, loading, error, analyze };
}
