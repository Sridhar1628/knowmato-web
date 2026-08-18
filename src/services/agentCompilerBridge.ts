export const AGENT_COMPILER_STORAGE_KEY =
  'knowmato_agent_compiler_payload';

export const AGENT_COMPILER_RESULT_PREFIX =
  'knowmato_agent_compiler_result_';

export interface AgentCompilerPayload {
  executionId: string;
  code: string;
  language: string;
  returnPath: string;
  createdAt: number;
}

export interface AgentCompilerResult {
  executionId: string;
  output: string;
  status: 'success' | 'error' | 'stopped';
  exitCode?: number;
  completedAt: number;
}

export function createAgentExecutionId(): string {
  return `agent-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function saveAgentCompilerPayload(
  payload: AgentCompilerPayload
): void {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem(
    AGENT_COMPILER_STORAGE_KEY,
    JSON.stringify(payload)
  );
}

export function getAgentCompilerPayload(): AgentCompilerPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(
      AGENT_COMPILER_STORAGE_KEY
    );

    if (!raw) return null;

    return JSON.parse(raw) as AgentCompilerPayload;
  } catch (error) {
    console.error(
      'Failed to read Agent compiler payload:',
      error
    );

    return null;
  }
}

export function clearAgentCompilerPayload(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(
    AGENT_COMPILER_STORAGE_KEY
  );
}

export function saveAgentCompilerResult(
  result: AgentCompilerResult
): void {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem(
    `${AGENT_COMPILER_RESULT_PREFIX}${result.executionId}`,
    JSON.stringify(result)
  );
}

export function getAgentCompilerResult(
  executionId: string
): AgentCompilerResult | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(
      `${AGENT_COMPILER_RESULT_PREFIX}${executionId}`
    );

    if (!raw) return null;

    return JSON.parse(raw) as AgentCompilerResult;
  } catch (error) {
    console.error(
      'Failed to read Agent compiler result:',
      error
    );

    return null;
  }
}