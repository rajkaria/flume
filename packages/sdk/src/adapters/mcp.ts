import type { CallOptions, ToolCallResult, McpToolCallParams } from '../types/index.js';
import { FlumeClient } from '../FlumeClient.js';

export class FlumeMcpAdapter {
  private readonly client: FlumeClient;

  constructor(client: FlumeClient) {
    this.client = client;
  }

  async callTool<T = unknown>(
    params: McpToolCallParams,
    options?: CallOptions,
  ): Promise<ToolCallResult<T>> {
    return this.client.callTool<T>(
      params.serverUrl,
      params.method,
      params.params ?? {},
      options,
    );
  }
}
