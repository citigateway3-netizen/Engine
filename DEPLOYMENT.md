# Deployment Guide - Pool Monitoring

Instructions for deploying the pool monitoring system to production.

## Option 1: Vercel Deployment (Next.js App + Convex)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add pool monitoring system"
git push origin main
```

### Step 2: Deploy to Vercel

Option A: Via Vercel Dashboard
1. Go to https://vercel.com
2. Import your GitHub repo
3. Configure environment variables (see below)
4. Deploy

Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

### Step 3: Set Environment Variables in Vercel

In your Vercel project settings → Environment Variables:

```
HELIUS_API_KEY=your_helius_api_key
POOL_MONITOR_SECRET=your_random_secret
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Step 4: Deploy Monitoring Service

The pool monitoring service runs separately. You have options:

#### Option A: Heroku (Recommended for Hobby)
```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create your-pool-monitor

# Set environment variables
heroku config:set HELIUS_API_KEY=your_key
heroku config:set POOL_MONITOR_SECRET=your_secret
heroku config:set NEXT_PUBLIC_API_URL=https://your-app.vercel.app

# Add Procfile for monitoring
echo "web: npm run monitor" > Procfile

# Deploy
git push heroku main
```

#### Option B: AWS Lambda (Cost-effective)
```bash
# Install Serverless Framework
npm i -g serverless

# Create serverless.yml for pool monitor
# (See template below)

# Deploy
serverless deploy
```

#### Option C: Railway (Simple, Recommended)
1. Go to https://railway.app
2. Create new project
3. Connect GitHub repo
4. Add environment variables
5. Set start command: `npm run monitor`
6. Deploy

#### Option D: Your Own Server (VPS)
```bash
# SSH into server
ssh your-server.com

# Clone repo
git clone https://github.com/your-org/Engine.git
cd Engine

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
HELIUS_API_KEY=your_key
POOL_MONITOR_SECRET=your_secret
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
EOF

# Run with PM2 for persistence
npm i -g pm2
pm2 start scripts/pool-monitor.ts --name "pool-monitor"
pm2 save
pm2 startup
```

## Option 2: Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose port for health checks
EXPOSE 3000

# Start monitoring service
CMD ["npm", "run", "monitor"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - HELIUS_API_KEY=${HELIUS_API_KEY}
      - POOL_MONITOR_SECRET=${POOL_MONITOR_SECRET}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Deploy Docker

```bash
# Build
docker build -t pool-monitor .

# Run
docker run -e HELIUS_API_KEY=xxx -e POOL_MONITOR_SECRET=yyy pool-monitor

# Or with docker-compose
docker-compose up -d
```

## Option 3: Kubernetes (Advanced)

### Create k8s deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pool-monitor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pool-monitor
  template:
    metadata:
      labels:
        app: pool-monitor
    spec:
      containers:
      - name: pool-monitor
        image: your-registry/pool-monitor:latest
        env:
        - name: HELIUS_API_KEY
          valueFrom:
            secretKeyRef:
              name: pool-monitor-secrets
              key: api-key
        - name: POOL_MONITOR_SECRET
          valueFrom:
            secretKeyRef:
              name: pool-monitor-secrets
              key: monitor-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        imagePullPolicy: Always
```

### Deploy

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/secrets.yaml
```

## Recommended Architecture

### Production Setup

```
┌────────────────────────────┐
│  Your Domain               │
│  (your-app.com)            │
└────────────┬───────────────┘
             │
    ┌────────┴─────────┐
    │                  │
┌───▼──────────┐  ┌────▼────────────┐
│ Vercel       │  │ Pool Monitor    │
│ (Next.js)    │  │ (Railway/Heroku)│
│              │  │                 │
│ /            │  │ Runs 24/7       │
│ /api/pools/* │  │ → POST /api/    │
└───┬──────────┘  └────┬────────────┘
    │                  │
    └────────┬─────────┘
             │
    ┌────────▼──────────┐
    │ Convex Database   │
    │ (serverless)      │
    └───────────────────┘
```

### Environment Variables

Set these in each platform:

| Variable | Example | Source |
|----------|---------|--------|
| `HELIUS_API_KEY` | `abc123xyz789` | https://helius.dev |
| `POOL_MONITOR_SECRET` | `sak_random_32_chars` | Generate: `openssl rand -hex 16` |
| `NEXT_PUBLIC_API_URL` | `https://app.vercel.app` | Your Vercel domain |
| `NEXT_PUBLIC_CONVEX_URL` | `https://your-instance.convex.cloud` | Convex dashboard |

## Monitoring the Monitor

### Health Checks

Add health endpoint to monitor:

```typescript
// scripts/pool-monitor.ts - add at top

let lastHeartbeat = Date.now();

// Update on pool discovery
ws.on('message', () => {
  lastHeartbeat = Date.now();
});

// HTTP health endpoint
if (process.env.ENABLE_HEALTH_CHECK === 'true') {
  const http = require('http');
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      const uptime = Date.now() - lastHeartbeat;
      if (uptime < 30000) { // 30 seconds
        res.writeHead(200);
        res.end('OK');
      } else {
        res.writeHead(503);
        res.end('Unhealthy');
      }
    }
  });
  server.listen(3001);
}
```

### Logging to External Service

Example with Sentry:

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Wrap monitor startup
Sentry.captureMessage('Pool monitor started', 'info');

// Capture errors
ws.on('error', (error) => {
  Sentry.captureException(error);
  console.error('[Meteora] WebSocket error:', error);
});
```

### Metrics Collection

Example with StatsD:

```typescript
const StatsD = require('node-statsd').StatsD;
const client = new StatsD();

// Track pool discoveries
client.increment('pools.discovered');
client.gauge('pools.total', discoveredPools.size);

// Track syncs
client.timing('pools.sync.duration', syncDuration);
```

## Scaling Considerations

### Single Monitor Instance
- Good for: < 100K pools/hour
- Cost: ~$5-10/month (Heroku Eco)
- Database: Convex free tier (sufficient)

### Multiple Regions
- Replicate monitor in different regions
- Use database failover
- Load balance sync requests

### High Volume
- Run multiple monitor instances
- Each tracks different protocol
- Central database aggregates
- Add caching layer (Redis)

## Cost Estimation

| Component | Service | Cost |
|-----------|---------|------|
| Next.js App | Vercel | Free-$20/mo |
| Monitor Service | Railway/Heroku | $5-50/mo |
| Database | Convex | Free-$20/mo |
| Helius RPC | Helius | Free tier (high limits) |
| **Total** | | **~$10-90/mo** |

## SSL/HTTPS

The `/api/pools/sync` endpoint should always use HTTPS in production.

Vercel automatically provides SSL. For external monitor:

```bash
# Use ngrok for local development
npm install -g ngrok
ngrok http 3000

# For production, use Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

## Backup & Recovery

### Database Backups

Convex handles this automatically. Access via dashboard:
1. https://dashboard.convex.dev
2. Your project → Data → Backups
3. Export as needed

### Monitor State

Monitor is stateless except for in-memory cache. Safe to restart.

### Configuration Backup

```bash
# Backup environment
env | grep -E "HELIUS|POOL_MONITOR" > backup.env

# Restore
source backup.env
```

## Monitoring Commands

### Check Monitor Status

```bash
# SSH into server
ssh your-server.com

# Check if running
pm2 list

# View logs
pm2 logs pool-monitor

# Restart if needed
pm2 restart pool-monitor
```

### View Sync Status

Check your app's `/api/pools/sync` endpoint:

```bash
curl -X GET https://your-app.vercel.app/api/pools/sync
```

### Database Stats

In Convex dashboard:
1. Collections → monitoredPools
2. View document count
3. Check last update time

## Troubleshooting Deployment

### Monitor disconnects frequently
→ Check network stability, increase ping interval

### High memory usage
→ Restart daily via cron: `0 2 * * * pm2 restart pool-monitor`

### Slow API sync
→ Check Convex quota, add database indexes

### Missing environment variables
→ Verify all 3 required vars set in platform settings

## Next Steps

1. ✅ Deploy Next.js app to Vercel
2. ✅ Deploy monitor to Railway/Heroku
3. ✅ Set all environment variables
4. ✅ Test `/api/pools/sync` endpoint
5. ✅ Verify pools appearing in UI
6. ✅ Set up monitoring/alerting
7. ✅ Enable automatic backups
8. ✅ Document your deployment

## Support

- Vercel docs: https://vercel.com/docs
- Convex docs: https://docs.convex.dev
- Helius docs: https://docs.helius.dev
- Your issues? Check logs and error messages!
