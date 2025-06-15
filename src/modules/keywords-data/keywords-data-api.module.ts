import { BaseModule, ToolDefinition } from '../base.module.js';
import { GoogleAdsSearchVolumeTool } from './tools/google-ads-search-volume.tool.js';

export class KeywordsDataApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new GoogleAdsSearchVolumeTool(this.dataForSEOClient),
      // Add more tools here
    ];

    return tools.reduce((acc, tool) => ({
      ...acc,
      [tool.getName()]: {
        description: tool.getDescription(),
        params: tool.getParams(),
        handler: (params: any) => tool.handle(params),
      },
    }), {});
  }
} 