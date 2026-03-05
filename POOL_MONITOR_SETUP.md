# Pool Monitor Setup Guide

## Overview

This project now includes real-time WebSocket monitoring for **Meteora** and **Raydium** new token pools on Solana using the Helius RPC API.

## Features

✅ **Real-time WebSocket Monitoring**
- Meteora DLMM pool creation events
- Raydium AMM pool creation events
- Automatic reconnection on disconnect

✅ **Data Persistence**
- Pools stored in Convex database
- Automatic sync every 3 hours
- Metadata enrichment support

✅ **UI Integration**
- Live pool feed component
- Pool statistics dashboard
- Type filtering (Meteora/Raydium)
- Transaction links to Solscan

## Prerequisites

1. **Helius API Key** - Get from https://www.helius.dev/
2. **Convex Account** - Already configured in your project
3. **Environment Variables** - Set in `.env.local`

## Environment Variables

Add these to your `.env.local` file:

```bash
# Helius API Configuration
HELIUS_API_KEY=your_helius_api_key_here

# Pool Monitor Security
POOL_MONITOR_SECRET=your_secure_random_secret_here

# API URL (for pool sync)
NEXT_PUBLIC_API_URL=http://localhost:3000  # or your production URL
```

## Installation

1. **Install Dependencies**
```bash
npm install
# or
pnpm install
# or
yarn install
```

The `ws` package is already added to `package.json`.

## Running the Pool Monitor

### Option 1: Run as Standalone Service (Production)

```bash
# Start the monitoring service in a separate terminal
npm run monitor
```

Add this script to your `package.json`:
```json
{
  "scripts": {
    "monitor": "ts-node scripts/pool-monitor.ts",
    "monitor:meteora": "ts-node scripts/meteora-monitor.ts",
    "monitor:raydium": "ts-node scripts/raydium-monitor.ts"
  }
}
```

### Option 2: Run with Node.js Directly

```bash
# Install ts-node if not already installed
npm install -D ts-node

# Run Meteora monitoring
node scripts/meteora-monitor.ts

# Or Raydium
node scripts/raydium-monitor.ts

# Or both (orchestrated)
node scripts/pool-monitor.ts
```

### Option 3: Integrated into Next.js (Development)

Add to your `next.config.ts`:
```typescript
import { createServer } from 'http';
import { connectMeteoraMonitor } from './scripts/meteora-monitor';
import { connectRaydiumMonitor } from './scripts/raydium-monitor';

// Start monitors on dev server startup
if (process.env.NODE_ENV === 'development') {
  connectMeteoraMonitor();
  connectRaydiumMonitor();
}
```

## How It Works

### Architecture

```
WebSocket (Helius)
    ↓
Meteora Monitor + Raydium Monitor
    ↓
Pool Monitor Orchestrator
    ↓
API Endpoint (/api/pools/sync)
    ↓
Convex Database
    ↓
React Components
```

### Data Flow

1. **WebSocket Connection**: Connects to Helius mainnet WebSocket using Helius API key
2. **Event Listening**: Listens for transaction subscriptions on:
   - Meteora program: `Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB`
   - Raydium program: `675kPX9MHTjS2zt1qrNifVVwz6cqVKMQdypQneEány3`
3. **Pool Detection**: Identifies pool creation events from transaction logs
4. **Data Aggregation**: Collects pools with metadata
5. **Sync Cycle**: Every 3 hours, syncs discovered pools to backend
6. **Database Storage**: Pools stored in Convex with full history
7. **UI Display**: Real-time updates in MonitoredPoolsFeed component

### Sync Endpoint

**POST** `/api/pools/sync`

Request:
```json
{
  "pools": [
    {
      "id": "transaction_signature",
      "type": "meteora",
      "signature": "tx_hash",
      "creator": "wallet_address",
      "poolAddress": "pool_address",
      "timestamp": 1234567890,
      "discovered": "2024-01-15T10:30:00Z"
    }
  ],
  "timestamp": 1234567890
}
```

Headers:
```
Authorization: Bearer your_pool_monitor_secret
```

Response:
```json
{
  "success": true,
  "stored": 25,
  "total": 25,
  "timestamp": 1234567890
}
```

## Monitoring Console Output

```
🚀 Starting Pool Monitor...

[Meteora] Connected to Helius WebSocket
[Meteora] Subscribed to pool creation events
[Raydium] Connected to Helius WebSocket
[Raydium] Subscribed to pool creation events

🆕 [Meteora] New Pool Created:
   Transaction: 4xK2...Zy9N
   Pool: EqJz...4mKp
   Creator: H4n...vK2x

🆕 [Raydium] New Pool Created:
   Transaction: 5yL3...Aw0O
   Creator: K5o...xL3y
   Token Mint: Fj9K...8nQp

📊 [2024-01-15T10:45:00Z] Monitoring Status:
   Total Pools: 47
   Meteora: 28 | Raydium: 19
```

## Database Schema

### monitoredPools Table

```typescript
{
  _id: Id<"monitoredPools">;
  type: "meteora" | "raydium";
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: number;
  syncedAt: number;
  metadata?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    image?: string;
  };
}
```

### Indexes

- `by_signature`: Fast lookup by transaction signature
- `by_discovered`: Time-based queries for recent pools
- `by_type`: Filter by protocol (Meteora/Raydium)

## Convex API

### Queries

```typescript
// Get recent pools (last 24 hours)
api.pools.getRecent({ limit: 50, type?: 'meteora' | 'raydium' })

// Get pools by type
api.pools.getByType({ type: 'meteora' | 'raydium', limit: 30 })

// Get single pool
api.pools.getBySignature({ signature: '...' })

// Get pools from last 3 hours
api.pools.getRecent3Hours()

// Get statistics
api.pools.getStats()
```

### Mutations

```typescript
// Add pool
api.pools.add({
  type: 'meteora' | 'raydium',
  signature: '...',
  creator: '...',
  poolAddress?: '...',
  mint?: '...',
  timestamp: number,
  discovered: number,
  syncedAt: number
})

// Update metadata
api.pools.updateMetadata({
  poolId: Id<"monitoredPools">,
  metadata: { name?, symbol?, decimals?, image? }
})
```

## UI Component

The `MonitoredPoolsFeed` component displays:

- Live pool feed with real-time updates
- Tabs for filtering (All, Meteora, Raydium)
- Pool statistics (total count, recent count)
- Transaction details with Solscan links
- Auto-refresh status indicator

Usage:
```tsx
import { MonitoredPoolsFeed } from '@/components/MonitoredPoolsFeed';

export default function Dashboard() {
  return <MonitoredPoolsFeed />;
}
```

## Troubleshooting

### Connection Issues

**Problem**: WebSocket connection fails
```
[Meteora] WebSocket error: Connection refused
```

**Solution**:
1. Verify `HELIUS_API_KEY` is correct
2. Check internet connection
3. Verify Helius RPC endpoint is accessible
4. Check firewall/proxy settings

### No Pools Detected

**Problem**: Monitor runs but no pools appear

**Solution**:
1. Ensure WebSocket is connected (check console logs)
2. Wait for new pool creation transactions
3. Verify program IDs are correct
4. Check Helius API has access to transaction logs

### Sync Failures

**Problem**: Pools not appearing in Convex database

**Solution**:
1. Verify `POOL_MONITOR_SECRET` matches in monitor and API
2. Check Convex deployment is live
3. Monitor API endpoint for errors
4. Verify network connectivity between monitor and API

### High Memory Usage

**Problem**: Memory usage increases over time

**Solution**:
1. Monitor only stores pool references in memory (not full data)
2. Restart monitor service periodically
3. Adjust sync interval or pool retention window

## Performance Notes

- WebSocket connection uses event-driven architecture (low CPU)
- Ping interval: 10 seconds (keeps connection alive)
- Sync interval: 3 hours (configurable in `pool-monitor.ts`)
- Database indexes optimized for time-based queries
- UI updates via Convex real-time subscriptions

## Next Steps

1. ✅ Deploy pool monitor to your server/lambda
2. ✅ Add `MonitoredPoolsFeed` component to your dashboard
3. ✅ Set up monitoring alerts for new pools
4. ✅ Enhance with token metadata from Jupiter/Orca APIs
5. ✅ Add trading bot integration

## Support

For issues or questions:
- Check Helius documentation: https://docs.helius.dev/
- Verify Solana program IDs on Solscan
- Check Convex logs in your dashboard
