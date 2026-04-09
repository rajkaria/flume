import type { VercelAiToolDef, CallOptions, ToolCallResult } from '../types/index.js';
import { FlumeClient } from '../FlumeClient.js';

export function createFlumeTool(
  client: FlumeClient,
  def: VercelAiToolDef,
) {
  return {
    name: def.name,
    description: def.description,
    parameters: def.parameters,
    async execute(params: Record<string, unknown>, options?: CallOptions): Promise<ToolCallResult> {
      return client.callTool(def.flumeServerUrl, def.name, params, options);
    },
  };
}
