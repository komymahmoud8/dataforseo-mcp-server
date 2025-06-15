import { defaultGlobalToolConfig } from '../config/global.tool.js';

export class DataForSEOClient {
  private config: DataForSEOConfig;
  private authHeader: string;

  constructor(config: DataForSEOConfig) {
    this.config = config;
    const token = btoa(`${config.username}:${config.password}`);
    this.authHeader = `Basic ${token}`;
  }

  async makeRequest<T>(endpoint: string, method: string = 'POST', body?: any, forceFull: boolean = false): Promise<T> {
    let url = `${this.config.baseUrl || "https://api.dataforseo.com"}${endpoint}`;    
    if(!defaultGlobalToolConfig.fullResponse && !forceFull){
      url += '.ai';
    }
    // Import version dynamically to avoid circular dependencies
    const { version } = await import('../utils/version.js');
    
    const headers = {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json',
      'User-Agent': `DataForSEO-MCP-TypeScript-SDK/${version}`
    };

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, defaultGlobalToolConfig.httpTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error: unknown) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      // Handle timeout errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${defaultGlobalToolConfig.httpTimeout}ms. This may happen with resource-intensive operations like on_page_instant_pages.`);
      }
      
      throw error;
    }
  }
} 

export interface DataForSEOConfig {
  username: string;
  password: string;
  baseUrl?: string;
}