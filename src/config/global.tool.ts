import { z } from 'zod';

export const GlobalToolConfigSchema = z.object({
  fullResponse: z.boolean().default(false),
  httpTimeout: z.number().default(180000), // 3 minutes default timeout in milliseconds
});

export type GlobalToolConfig = z.infer<typeof GlobalToolConfigSchema>;

// Parse config from environment variables
export function parseGlobalToolConfig(): GlobalToolConfig {
  const config = {
    fullResponse: process.env.DATAFORSEO_FULL_RESPONSE === 'true' ? true : false,
    httpTimeout: process.env.DATAFORSEO_HTTP_TIMEOUT ? parseInt(process.env.DATAFORSEO_HTTP_TIMEOUT, 10) : 180000,
  };
  
  return GlobalToolConfigSchema.parse(config);
}

// Export default config
export const defaultGlobalToolConfig = parseGlobalToolConfig(); 