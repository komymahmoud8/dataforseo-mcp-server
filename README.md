# DataForSEO MCP Server

Model Context Protocol (MCP) server implementation for DataForSEO, enabling Claude to interact with selected DataForSEO APIs and obtain SEO data through a standardized interface.

## Features

- **SERP API**: real-time Search Engine Results Page (SERP) data for Google, Bing, and Yahoo
- **KEYWORDS_DATA API**: keyword research and clickstream data, including search volume, cost-per-click, and other metrics
- **ONPAGE API**: allows crawling websites and webpages according to customizable parameters to obtain on-page SEO performance metrics
- **DATAFORSEO_LABS API**: data on keywords, SERPs, and domains based on DataForSEO's in-house databases and proprietary algorithms
- **BACKLINKS API**: data on inbound links, referring domains and referring pages for any domain, subdomain, or webpage
- **BUSINESS_DATA API**: based on business reviews and business information publicly shared on platforms like Google, Trustpilot, Tripadvisor
- **DOMAIN_ANALYTICS API**: helps identify all possible technologies used for building websites and offers Whois data

## Prerequisites

- Node.js (v20 or higher)
- DataForSEO API credentials (API login and password)

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mcp-server-typescript
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your DataForSEO credentials
```

4. Build and run:
```bash
npm run build
npm run http  # For HTTP server
# or
npm start     # For STDIO server
```

### Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

#### One-Click Deploy
1. Click the "Deploy on Railway" button above
2. Set your environment variables:
   - `DATAFORSEO_USERNAME`: Your DataForSEO API username
   - `DATAFORSEO_PASSWORD`: Your DataForSEO API password
   - `PORT`: Will be set automatically by Railway
3. Deploy!

#### Manual Deploy
1. Fork this repository
2. Connect your Railway account to GitHub
3. Create a new Railway project from your forked repository
4. Set environment variables in Railway dashboard
5. Deploy automatically triggers

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Required - DataForSEO API Credentials
DATAFORSEO_USERNAME=your_dataforseo_username
DATAFORSEO_PASSWORD=your_dataforseo_password

# Optional - Server Configuration
PORT=3000
NODE_ENV=production

# Optional - Module Configuration
# Specify which modules to enable (comma-separated)
# If not set, all modules will be enabled
ENABLED_MODULES=SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS

# Optional - Response Configuration
# If set to true, returns full unmodified API responses
# If false or not set, returns filtered and transformed responses
DATAFORSEO_FULL_RESPONSE=false
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### MCP Endpoint
```
POST /mcp
```
Main MCP protocol endpoint for tool calls.

### Available Tools
```
GET /tools
```
Lists all available DataForSEO tools.

## Authentication

The server supports multiple authentication methods:

### 1. Basic Authentication (Recommended for API clients)
```bash
curl -X POST https://your-railway-app.railway.app/mcp \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### 2. Environment Variables
If no Basic Auth header is provided, the server uses credentials from environment variables.

## Available Modules & Tools

### SERP Module
- `serp_google_organic` - Get Google organic search results
- `serp_google_ads` - Get Google Ads results
- `serp_bing_organic` - Get Bing organic search results

### Keywords Data Module
- `keywords_data_search_volume` - Get search volume data
- `keywords_data_keyword_suggestions` - Get keyword suggestions
- `keywords_data_keyword_ideas` - Get keyword ideas

### OnPage Module
- `onpage_page_screenshot` - Get webpage screenshots
- `onpage_content_parsing` - Parse webpage content
- `onpage_lighthouse` - Get Lighthouse audit data

### DataForSEO Labs Module
- `dataforseo_labs_ranked_keywords` - Get keywords a domain ranks for
- `dataforseo_labs_competitors_domain` - Get competitor domains
- `dataforseo_labs_domain_intersection` - Find common keywords between domains

### Backlinks Module
- `backlinks_summary` - Get backlinks summary for a domain
- `backlinks_referring_domains` - Get referring domains
- `backlinks_anchors` - Get anchor text analysis

### Business Data Module
- `business_data_google_reviews` - Get Google business reviews
- `business_data_trustpilot_reviews` - Get Trustpilot reviews
- `business_data_business_info` - Get business information

### Domain Analytics Module
- `domain_analytics_technologies` - Get website technologies
- `domain_analytics_whois` - Get domain WHOIS data

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev  # Watch mode with TypeScript compilation
```

### Running Different Modes
```bash
npm start    # STDIO mode (for direct MCP communication)
npm run http # HTTP mode (for web API)
npm run sse  # Server-Sent Events mode
```

## Production Deployment

### Railway Specific Configuration

The application is configured for Railway deployment with:
- Automatic port detection via `PORT` environment variable
- Health check endpoint at `/health`
- Proper error handling and logging
- Production-ready HTTP server

### Performance Considerations

- The server implements response filtering to reduce payload size
- Configurable module loading to reduce memory footprint
- Request timeout handling for DataForSEO API calls
- Proper error handling and retry logic

## Monitoring & Debugging

### Health Check
Monitor your deployment:
```bash
curl https://your-app.railway.app/health
```

### Logs
View logs in Railway dashboard or via CLI:
```bash
railway logs
```

### Testing Tools
```bash
# Test specific tool
curl -X POST https://your-app.railway.app/mcp \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "serp_google_organic",
      "arguments": {
        "keyword": "SEO tools",
        "location": "United States"
      }
    }
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -am 'Add new tool'`
6. Push to the branch: `git push origin feature/new-tool`
7. Submit a pull request

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- [DataForSEO API Documentation](https://docs.dataforseo.com/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Railway Documentation](https://docs.railway.com/)

## Changelog

### v2.2.6
- Added Railway deployment support
- Improved health check endpoint
- Enhanced error handling
- Updated documentation