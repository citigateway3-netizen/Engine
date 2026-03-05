# Pool Monitoring Implementation Guide

## 📋 What Was Added

This document outlines all the changes made to integrate real-time Meteora and Raydium pool monitoring into your project.

## 🎯 New Files Created

### 1. WebSocket Monitoring Scripts

#### `/scripts/meteora-monitor.ts`
- Monitors Meteora DLMM pool creation events
- Uses Helius WebSocket API with your HELIUS_API_KEY
- Listens for `InitializeLbPair` and `CreatePool` logs
- Extracts pool address, creator, and signature
- Auto-reconnects on disconnection

#### `/scripts/raydium-monitor.ts`
- Monitors Raydium AMM pool creation events
- Uses Helius WebSocket API
- Listens for `initialize2` and `InitializeMint` logs
- Extracts mint address, creator, and signature
- Auto-reconnects on disconnection

#### `/scripts/pool-monitor.ts`
- Orchestrates both Meteora and Raydium monitoring
- Aggregates discovered pools
- Auto-syncs to backend every 3 hours
- Provides pool statistics
- Handles graceful shutdown

### 2. API Endpoints

#### `/src/app/api/pools/sync/route.ts`
- **POST** - Receives and stores pools from monitoring service
- **GET** - Fetches recent monitored pools
- Validates authorization with `POOL_MONITOR_SECRET`
- Stores pools in Convex database
- Returns sync statistics

### 3. Database Integration

#### `/convex/pools.ts`
Contains queries and mutations:

**Mutations:**
- `add()` - Add new monitored pool (prevents duplicates)
- `updateMetadata()` - Update pool metadata (name, symbol, etc.)

**Queries:**
- `getRecent()` - Get pools from last 24 hours
- `getByType()` - Filter pools by protocol (Meteora/Raydium)
- `getBySignature()` - Fetch single pool by tx signature
- `getRecent3Hours()` - Get pools from last 3 hours
- `getStats()` - Get aggregated statistics

#### Updated `/convex/schema.ts`
Added `monitoredPools` table with:
- Pool type (meteora | raydium)
- Transaction signature
- Creator address
- Pool/mint addresses
- Discovery timestamp
- Optional metadata (name, symbol, decimals, image)
- Indexes for efficient querying

### 4. UI Component

#### `/src/components/MonitoredPoolsFeed.tsx`
A fully-featured React component with:
- **Live Pool Display** - Shows recent pools with real-time updates
- **Tab Filtering** - Filter by all pools, Meteora only, or Raydium only
- **Statistics** - Total pools, recent count, pool type breakdown
- **Pool Details** - Creator, pool/mint addresses, timestamps
- **Direct Links** - Solscan view buttons for each pool
- **Auto-refresh** - Updates via Convex subscriptions
- **Responsive** - Works on mobile and desktop

### 5. Updated UI Pages

#### `/src/app/page.tsx`
- Added new "Pools" tab for mobile navigation
- Integrated MonitoredPoolsFeed component
- Added pool monitoring to feature pills
- Updated status bar with WebSocket indicator
- Mobile-friendly panel switching

## 🔧 Configuration Required

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Required for WebSocket connection
HELIUS_API_KEY=your_helius_api_key_here

# Required for API authentication
POOL_MONITOR_SECRET=generate_a_random_secret_string_here

# Optional (defaults to localhost:3000 in dev)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Generate a secure secret for `POOL_MONITOR_SECRET`:
```bash
# macOS/Linux
openssl rand -hex 32

# Or use any random string generator
```

### 2. Dependencies

Added to `package.json`:
```json
"ws": "^8.17.0"
```

Install with:
```bash
npm install
# or
pnpm install
```

### 3. NPM Scripts

Added to `package.json`:
```json
{
  "scripts": {
    "monitor": "NODE_OPTIONS='--loader ts-node/esm' node --experimental-modules scripts/pool-monitor.ts",
    "monitor:meteora": "NODE_OPTIONS='--loader ts-node/esm' node --experimental-modules scripts/meteora-monitor.ts",
    "monitor:raydium": "NODE_OPTIONS='--loader ts-node/esm' node --experimental-modules scripts/raydium-monitor.ts"
  }
}
```

## 🚀 Running the System

### Step 1: Start Your Next.js App
```bash
npm run dev
# App runs at http://localhost:3000
```

### Step 2: Start Pool Monitoring Service (in another terminal)

**Option A: Orchestrated Monitoring (Recommended)**
```bash
npm run monitor
```
This starts both Meteora and Raydium monitoring with automatic sync.

**Option B: Separate Services**
```bash
# Terminal 2
npm run monitor:meteora

# Terminal 3
npm run monitor:raydium
```

**Option C: Direct Node.js**
```bash
# If ts-node is installed globally
node --loader ts-node/esm scripts/pool-monitor.ts
```

### Step 3: View in UI

Navigate to http://localhost:3000 and click the "Pools" tab to see:
- Real-time pool discoveries
- Pool statistics
- Type-specific filtering
- Direct Solscan links

## 📊 How It Works

### Architecture Flow

```
┌─────────────────────────────────────────────────┐
│ Your Monitoring Service (Node.js)               │
├─────────────────────────────────────────────────┤
│ ┌──────────────────┐    ┌──────────────────┐   │
│ │ Meteora Monitor  │    │ Raydium Monitor  │   │
│ │  WebSocket       │    │  WebSocket       │   │
│ │  Connection      │    │  Connection      │   │
│ └────────┬─────────┘    └────────┬─────────┘   │
│          │                       │              │
│          └───────────┬───────────┘              │
│                      │                          │
│          ┌───────────▼────────────┐            │
│          │ Pool Monitor Orchestrator            │
│          │ (Sync & Aggregate)                  │
│          └───────────┬────────────┘            │
└────────────────────────┼──────────────────────┘
                         │
              ┌──────────▼──────────┐
              │ Your Next.js Server │
              │  /api/pools/sync    │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ Convex Database     │
              │ monitoredPools      │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │ React UI Components │
              │ MonitoredPoolsFeed  │
              └─────────────────────┘
```

### Data Flow for New Pool Discovery

```
1. WebSocket receives transaction from Helius RPC
   ↓
2. Monitor checks transaction logs for pool creation events
   ↓
3. If detected, extract: signature, creator, pool/mint address
   ↓
4. Store in local Map (in-memory cache)
   ↓
5. Every 3 hours: Sync all new pools to backend API
   ↓
6. API endpoint validates authorization and syncs to Convex
   ↓
7. React component queries Convex and displays in real-time
```

## 🔑 Key Program IDs

Used for WebSocket subscriptions:

```typescript
// Meteora DLMM
const METEORA_PROGRAM = 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB';

// Raydium AMM (v4)
const RAYDIUM_PROGRAM = '675kPX9MHTjS2zt1qrNifVVwz6cqVKMQdypQneEány3';
```

## 📈 Monitoring Logs

Expected console output when running:

```
🚀 Starting Pool Monitor...

[Meteora] Connected to Helius WebSocket
[Meteora] Subscribed to pool creation events
[Raydium] Connected to Helius WebSocket
[Raydium] Subscribed to pool creation events

🆕 [Meteora] New Pool Created:
   Transaction: 4xKz9nQp...
   Pool: EqJz4mKp...
   Creator: H4nvK2x...

🆕 [Raydium] New Pool Created:
   Transaction: 5yL3Aw0O...
   Creator: K5oxL3y...
   Token Mint: Fj9K8nQp...

📊 [2024-01-15T10:45:00Z] Monitoring Status:
   Total Pools: 47
   Meteora: 28 | Raydium: 19
```

## 🔐 Security Notes

1. **API Key**: Your `HELIUS_API_KEY` is used only for WebSocket connection. Helius provides high-rate limits.

2. **Monitor Secret**: `POOL_MONITOR_SECRET` is required for `/api/pools/sync`. Change it in production.

3. **No On-Chain Calls**: Monitoring doesn't make transactions, only observes events.

4. **Convex Auth**: Use Convex's built-in security for database access.

## 🐛 Troubleshooting

### Monitor won't connect
```
[Meteora] WebSocket error: Connection refused
```
**Fix**: Check HELIUS_API_KEY is valid and has proper permissions

### No pools appearing
```
Monitor runs but no 🆕 Pool Created messages
```
**Fix**: 
1. Wait for actual new pool creations (takes real Solana transactions)
2. Check Helius is receiving transactions (very high volume)
3. Verify program IDs are correct

### Pools not syncing to database
```
[API] Error storing pool...
```
**Fix**:
1. Check POOL_MONITOR_SECRET matches
2. Verify Convex deployment is active
3. Check API endpoint is accessible

### High memory usage
**Note**: Monitor stores pool references in memory (not full data). Restart periodically for long-running instances.

## 🔄 Sync Schedule

- **Connection**: Immediate (on startup)
- **Event Processing**: Real-time (as transactions occur)
- **Database Sync**: Every 3 hours (configurable)
- **Stats Logging**: Every 15 minutes (console only)
- **Ping Keep-Alive**: Every 10 seconds

To change sync interval, edit `/scripts/pool-monitor.ts`:
```typescript
const REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
```

## 📱 UI Features

### MonitoredPoolsFeed Component

**Features:**
- ✅ Tab filtering (All, Meteora, Raydium)
- ✅ Live pool count statistics
- ✅ Auto-updating from Convex
- ✅ Truncated wallet/pool addresses
- ✅ Time-ago formatting (e.g., "5m ago")
- ✅ Direct Solscan links
- ✅ Mobile responsive
- ✅ Color-coded pool types
- ✅ Status indicator (Blue=Meteora, Green=Raydium)

### Integration into Dashboard

Add to any page:
```tsx
import { MonitoredPoolsFeed } from '@/components/MonitoredPoolsFeed';

export default function Dashboard() {
  return (
    <div>
      <h1>My Dashboard</h1>
      <MonitoredPoolsFeed />
    </div>
  );
}
```

## 🎓 Next Steps

1. **Deploy Monitor** - Run on your server/lambda with 24/7 uptime
2. **Alert System** - Add notifications for specific pool criteria
3. **Token Metadata** - Enrich pools with Jupiter/Orca data
4. **Trading Integration** - Connect to trading bots/strategies
5. **Analytics** - Track pool creation rates, trends, patterns
6. **Token Analysis** - Integrate with your AI agents for automatic analysis

## 📚 Resources

- **Helius Docs**: https://docs.helius.dev/
- **Solana Program IDs**: https://solscan.io
- **Meteora**: https://meteora.ag/
- **Raydium**: https://raydium.io/
- **WebSocket APIs**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

## ✅ Checklist

Before deploying to production:

- [ ] Set HELIUS_API_KEY in environment
- [ ] Generate and set POOL_MONITOR_SECRET
- [ ] Configure NEXT_PUBLIC_API_URL
- [ ] Install ws dependency
- [ ] Test monitor script locally
- [ ] Verify pools appear in UI
- [ ] Check Convex database connection
- [ ] Set up monitoring/alerting for service
- [ ] Test database sync every 3 hours
- [ ] Plan for long-term data retention
