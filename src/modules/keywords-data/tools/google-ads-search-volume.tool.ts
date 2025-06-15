import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';

export class GoogleAdsSearchVolumeTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
  }

  getName(): string {
    return 'keywords_data_google_ads_search_volume';
  }

  getDescription(): string {
    return 'Get search volume data for keywords from Google Ads';
  }

  getParams(): z.ZodRawShape {
    return {
      location_name: z.string().default("United States").describe(`full name of the location
        required field
        in format "Country"
        example:
        United Kingdom`),
              language_code: z.string().describe("Language code (e.g., 'en')"),
      keywords: z.array(z.string()).describe("Array of keywords to get search volume for"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/google_ads/search_volume/live', 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keywords: params.keywords,
      }]);
      return this.validateAndFormatResponse(response);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 