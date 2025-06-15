import 'dotenv/config';
import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from 'zod';
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { DataForSEOClient, DataForSEOConfig } from './client/dataforseo.client.js';
import { SerpApiModule } from './modules/serp/serp-api.module.js';
import { KeywordsDataApiModule } from './modules/keywords-data/keywords-data-api.module.js';
import { OnPageApiModule } from './modules/onpage/onpage-api.module.js';
import { DataForSEOLabsApi } from './modules/dataforseo-labs/dataforseo-labs-api.module.js';
import { EnabledModulesSchema, isModuleEnabled } from './config/modules.config.js';
import { BaseModule, ToolDefinition } from './modules/base.module.js';
import { BacklinksApiModule } from "./modules/backlinks/backlinks-api.module.js";
import { BusinessDataApiModule } from "./modules/business-data-api/business-data-api.module.js";
import { DomainAnalyticsApiModule } from "./modules/domain-analytics/domain-analytics-api.module.js";
import { name, version } from './utils/version.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';

/**
 * This example server demonstrates backwards compatibility with both:
 * 1. The deprecated HTTP+SSE transport (protocol version 2024-11-05)
 * 2. The Streamable HTTP transport (protocol version 2025-03-26)
 * 
 * It maintains a single MCP server instance but exposes two transport options:
 * - /mcp: The new Streamable HTTP endpoint (supports GET/POST/DELETE)
 * - /sse: The deprecated SSE endpoint for older clients (GET to establish stream)
 * - /messages: The deprecated POST endpoint for older clients (POST to send messages)
 */

// Configuration constants
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  username?: string;
  password?: string;
}

// Transport interface with timestamp
interface TransportWithTimestamp {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  lastActivity: number;
}

// Store transports by session ID
const transports: Record<string, TransportWithTimestamp> = {};

// Cleanup function for stale connections
function cleanupStaleConnections() {
  const now = Date.now();
  Object.entries(transports).forEach(([sessionId, { transport, lastActivity }]) => {
    if (now - lastActivity > CONNECTION_TIMEOUT) {
      console.log(`Cleaning up stale connection for session ${sessionId}`);
      try {
        transport.close();
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
      delete transports[sessionId];
    }
  });
}

// Start periodic cleanup
const cleanupInterval = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL);

function getServer(username: string | undefined, password: string | undefined): McpServer {
  const server = new McpServer({
    name,
    version,
  }, { capabilities: { logging: {} } });

  // Initialize DataForSEO client
  const dataForSEOConfig: DataForSEOConfig = {
    username: username || "",
    password: password || "",
  };
  
  const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
  console.error('DataForSEO client initialized');
  
  // Parse enabled modules from environment
  const enabledModules = EnabledModulesSchema.parse(process.env.ENABLED_MODULES);
  
  // Initialize modules
  const modules: BaseModule[] = [];
  
  if (isModuleEnabled('SERP', enabledModules)) {
    modules.push(new SerpApiModule(dataForSEOClient));
  }
  if (isModuleEnabled('KEYWORDS_DATA', enabledModules)) {
    modules.push(new KeywordsDataApiModule(dataForSEOClient));
  }
  if (isModuleEnabled('ONPAGE', enabledModules)) {
    modules.push(new OnPageApiModule(dataForSEOClient));
  }
  if (isModuleEnabled('DATAFORSEO_LABS', enabledModules)) {
    modules.push(new DataForSEOLabsApi(dataForSEOClient));
  }
  if (isModuleEnabled('BACKLINKS', enabledModules)) {
    modules.push(new BacklinksApiModule(dataForSEOClient));
  }
  if (isModuleEnabled('BUSINESS_DATA', enabledModules)) {
    modules.push(new BusinessDataApiModule(dataForSEOClient));
  }
  if (isModuleEnabled('DOMAIN_ANALYTICS', enabledModules)) {
    modules.push(new DomainAnalyticsApiModule(dataForSEOClient));
  }

  // Register module tools
  modules.forEach(module => {
    const tools = module.getTools();
    Object.entries(tools).forEach(([name, tool]) => {
      const typedTool = tool as ToolDefinition;
      const schema = z.object(typedTool.params);
      server.tool(
        name,
        typedTool.description,
        schema.shape,
        typedTool.handler
      );
    });
  });

  return server;
}

// Create Express application
const app = express();
app.use(express.json());

// Basic Auth Middleware
const basicAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    next();
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (!username || !password) {
    console.error('Invalid credentials');
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Invalid credentials"
      },
      id: null
    });
    return;
  }

  req.username = username;
  req.password = password;
  next();
};

//=============================================================================
// STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
//=============================================================================

app.all('/mcp', basicAuth, async (req: Request, res: Response) => {
  console.log(`Received ${req.method} request to /mcp`);

  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // Handle credentials
    if (!req.username && !req.password) {
      const envUsername = process.env.DATAFORSEO_USERNAME;
      const envPassword = process.env.DATAFORSEO_PASSWORD;
      
      if (!envUsername || !envPassword) {
        res.status(401).json({
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Authentication required. Provide DataForSEO credentials."
          },
          id: null
        });
        return;
      }
      req.username = envUsername;
      req.password = envPassword;
    }

    if (sessionId && transports[sessionId]) {
      const transportData = transports[sessionId];
      if (transportData.transport instanceof StreamableHTTPServerTransport) {
        transport = transportData.transport;
        transportData.lastActivity = Date.now();
      } else {
        console.error('Session exists but uses a different transport protocol');
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Session exists but uses a different transport protocol',
          },
          id: null,
        });
        return;
      }
    } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
      const eventStore = new InMemoryEventStore();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore,
        onsessioninitialized: (sessionId: string) => {
          console.log(`StreamableHTTP session initialized with ID: ${sessionId}`);
          transports[sessionId] = {
            transport,
            lastActivity: Date.now()
          };
        }
      });

      const cleanup = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports map`);
          try {
            transport.close();
          } catch (error) {
            console.error(`Error closing transport for session ${sid}:`, error);
          }
          delete transports[sid];
        }
      };

      transport.onclose = cleanup;
      req.socket.setTimeout(CONNECTION_TIMEOUT);
      req.socket.on("error", cleanup);
      req.socket.on("timeout", cleanup);
      req.on("error", cleanup);
      res.on("error", cleanup);
      res.on("close", cleanup);

      const server = getServer(req.username, req.password);
      await server.connect(transport);
    } else {
      console.error('No valid session ID provided');
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

//=============================================================================
// DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
//=============================================================================

app.get('/sse', basicAuth, async (req: Request, res: Response) => {
  console.log('Received GET request to /sse (deprecated SSE transport)');

  // Handle credentials
  if (!req.username && !req.password) {
    const envUsername = process.env.DATAFORSEO_USERNAME;
    const envPassword = process.env.DATAFORSEO_PASSWORD;
    
    if (!envUsername || !envPassword) {
      console.error('No DataForSEO credentials provided');
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required. Provide DataForSEO credentials."
        },
        id: null
      });
      return;
    }
    req.username = envUsername;
    req.password = envPassword;
  }

  const transport = new SSEServerTransport('/messages', res);
  
  // Store transport with timestamp
  transports[transport.sessionId] = {
    transport,
    lastActivity: Date.now()
  };

  // Handle connection cleanup
  const cleanup = () => {
    try {
      transport.close();
    } catch (error) {
      console.error(`Error closing transport for session ${transport.sessionId}:`, error);
    }
    delete transports[transport.sessionId];
  };

  // Add multiple event listeners for different scenarios
  res.on("close", cleanup);
  res.on("error", cleanup);
  req.on("error", cleanup);
  req.socket.on("error", cleanup);
  req.socket.on("timeout", cleanup);

  // Set socket timeout
  req.socket.setTimeout(CONNECTION_TIMEOUT);

  const server = getServer(req.username, req.password);
  await server.connect(transport);
});

app.post("/messages", basicAuth, async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  
  // Handle credentials
  if (!req.username && !req.password) {
    const envUsername = process.env.DATAFORSEO_USERNAME;
    const envPassword = process.env.DATAFORSEO_PASSWORD;
    
    if (!envUsername || !envPassword) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required. Provide DataForSEO credentials."
        },
        id: null
      });
      return;
    }
    req.username = envUsername;
    req.password = envPassword;
  }

  const transportData = transports[sessionId];
  if (!transportData) {
    res.status(400).send('No transport found for sessionId');
    return;
  }

  if (!(transportData.transport instanceof SSEServerTransport)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session exists but uses a different transport protocol',
      },
      id: null,
    });
    return;
  }

  // Update last activity timestamp
  transportData.lastActivity = Date.now();
  
  await transportData.transport.handlePostMessage(req, res, req.body);
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(PORT, () => {
  console.log(`DataForSEO MCP Server with SSE compatibility listening on port ${PORT}`);
  console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

1. Streamable Http (Protocol version: 2025-03-26)
   Endpoint: /mcp
   Methods: GET, POST, DELETE
   Usage: 
     - Initialize with POST to /mcp
     - Establish SSE stream with GET to /mcp
     - Send requests with POST to /mcp
     - Terminate session with DELETE to /mcp

2. Http + SSE (Protocol version: 2024-11-05)
   Endpoints: /sse (GET) and /messages (POST)
   Usage:
     - Establish SSE stream with GET to /sse
     - Send requests with POST to /messages?sessionId=<id>
==============================================
`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Clear cleanup interval
  clearInterval(cleanupInterval);

  // Close HTTP server
  server.close();

  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].transport.close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});