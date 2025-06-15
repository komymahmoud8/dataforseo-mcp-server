import { z } from 'zod';

export const GlobalToolConfigSchema = z.object({
  fullResponse: z.boolean().default(false),
});

export type GlobalToolConfig = z.infer<typeof GlobalToolConfigSchema>;

// Parse config from environment variables
export function parseGlobalToolConfig(): GlobalToolConfig {
  const config = {
    fullResponse: process.env.DATAFORSEO_FULL_RESPONSE === 'true' ? true : false,
  };
  
  return GlobalToolConfigSchema.parse(config);
}

// Export default config
export const defaultGlobalToolConfig = parseGlobalToolConfig(); 