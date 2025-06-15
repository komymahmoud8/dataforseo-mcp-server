# Railway Deployment Guide

This guide will help you deploy the DataForSEO MCP Server to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **DataForSEO Credentials**: Get your API credentials from [DataForSEO](https://dataforseo.com/)
3. **GitHub Account**: For repository hosting

## Quick Deploy

### Option 1: One-Click Deploy (Recommended)

1. Click the deploy button in the README
2. Connect your GitHub account to Railway
3. Set environment variables (see below)
4. Deploy!

### Option 2: Manual Deploy

1. **Fork this repository** to your GitHub account

2. **Connect Railway to GitHub**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Authorize Railway to access your repositories

3. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

4. **Configure environment variables** (see section below)

5. **Deploy**: Railway will automatically build and deploy your application

## Environment Variables

Set these in your Railway project dashboard:

### Required Variables

```bash
DATAFORSEO_USERNAME=your_dataforseo_username
DATAFORSEO_PASSWORD=your_dataforseo_password
```

### Optional Variables

```bash
# Module Configuration
ENABLED_MODULES=SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS,BACKLINKS,BUSINESS_DATA,DOMAIN_ANALYTICS

# Response Configuration
DATAFORSEO_FULL_RESPONSE=false

# Node Environment
NODE_ENV=production
```

### Railway Auto-Set Variables

These are automatically set by Railway:

```bash
PORT=3000  # Railway sets this automatically
RAILWAY_ENVIRONMENT=production
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app
```

## Setting Environment Variables

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add each environment variable:
   - Click "New Variable"
   - Enter the variable name and value
   - Click "Add"

## Deployment Process

Railway will automatically:

1. **Build**: Run `npm install` and `npm run build`
2. **Start**: Run `npm run http` (as defined in Procfile)
3. **Health Check**: Monitor `/health` endpoint
4. **Assign Domain**: Provide a public URL

## Monitoring Your Deployment

### Health Check

Your app will be available at: `https://your-app.railway.app`

Test the health endpoint:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "DataForSEO MCP Server",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs

View logs in Railway dashboard:
1. Go to your project
2. Click on your service
3. Go to "Deployments" tab
4. Click on a deployment to view logs

Or use Railway CLI:
```bash
railway logs
```

### Testing the API

Test the MCP endpoint:
```bash
curl -X POST https://your-app.railway.app/mcp \
  -H "Authorization: Basic $(echo -n 'your_username:your_password' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility (>=20.0.0)

2. **Authentication Errors**
   - Verify DataForSEO credentials are correct
   - Check environment variables are set properly

3. **Health Check Failures**
   - Ensure the app starts on the correct PORT
   - Check logs for startup errors

4. **Module Loading Issues**
   - Verify `ENABLED_MODULES` environment variable
   - Check that all required modules are available

### Debug Steps

1. **Check Deployment Logs**:
   - Go to Railway dashboard
   - View deployment logs for errors

2. **Test Locally**:
   ```bash
   npm install
   npm run build
   npm run http
   ```

3. **Verify Environment**:
   ```bash
   curl https://your-app.railway.app/health
   ```

4. **Test Authentication**:
   ```bash
   curl -X POST https://your-app.railway.app/mcp \
     -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
   ```

## Performance Optimization

### Railway Configuration

The app is configured with:
- **Health checks**: `/health` endpoint monitored every 30 seconds
- **Restart policy**: Automatic restart on failure (max 10 retries)
- **Resource limits**: Optimized for Railway's free tier

### Application Optimization

- **Response filtering**: Reduces payload size for better performance
- **Module loading**: Only enabled modules are loaded
- **Connection pooling**: Efficient DataForSEO API connections
- **Error handling**: Graceful error responses

## Scaling

### Vertical Scaling
- Upgrade Railway plan for more CPU/memory
- Monitor resource usage in Railway dashboard

### Horizontal Scaling
- Railway automatically handles load balancing
- Consider caching for high-traffic scenarios

## Security

### Best Practices

1. **Environment Variables**: Never commit credentials to code
2. **HTTPS**: Railway provides SSL certificates automatically
3. **Authentication**: Use Basic Auth for API access
4. **Rate Limiting**: Consider implementing rate limiting for production

### Monitoring

- Monitor failed requests in Railway logs
- Set up alerts for health check failures
- Track API usage and costs

## Support

- **Railway Documentation**: [docs.railway.com](https://docs.railway.com/)
- **DataForSEO API Docs**: [docs.dataforseo.com](https://docs.dataforseo.com/)
- **Issues**: Create GitHub issues for bugs or feature requests

## Next Steps

After successful deployment:

1. **Test all endpoints** with your DataForSEO credentials
2. **Monitor performance** and adjust configuration as needed
3. **Set up monitoring** and alerts
4. **Document your API usage** for your applications
5. **Consider implementing caching** for frequently accessed data 