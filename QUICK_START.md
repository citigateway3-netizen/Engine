# 🚀 Quick Start: Pool Monitoring

Get monitoring running in 5 minutes!

## Step 1: Set Environment Variables (2 min)

Create `.env.local` in your project root:

```bash
# Get from https://www.helius.dev/ (free tier available)
HELIUS_API_KEY=your_api_key_here

# Generate random secret for API authentication
POOL_MONITOR_SECRET=your_random_secret_here

# (Optional) Your API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**To generate a secret:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Step 2: Install Dependencies (1 min)

```bash
npm install
```

The `ws` package is already in `package.json`.

## Step 3: Start Your App (1 min)

Terminal 1:
```bash
npm run dev
```

Open http://localhost:3000 in browser.

## Step 4: Start Pool Monitoring (1 min)

Terminal 2:
```bash
npm run monitor
```

You should see:
```
🚀 Starting Pool Monitor...
[Meteora] Connected to Helius WebSocket
[Raydium] Connected to Helius WebSocket
[Meteora] Subscribed to pool creation events
[Raydium] Subscribed to pool creation events
```

## Step 5: View Live Pools (0 min)

Go to http://localhost:3000 and click the **Pools** tab!

You'll see:
- 📊 Pool statistics
- 🔵 Meteora pools in real-time
- 🟢 Raydium pools in real-time
- Direct Solscan links for each pool

---

## 📊 What's Happening

1. **Monitor Service** listens to Solana blockchain via WebSocket
2. **Detects** new Meteora & Raydium pools as they're created
3. **Syncs** to your database every 3 hours
4. **UI Updates** in real-time from Convex

---

## 🎯 What You Can Do Next

### View Specific Protocol
Click "Meteora" or "Raydium" tabs to see only that protocol's pools.

### Analyze Pools
Right-click a pool signature → "Open in new tab" → View on Solscan.

### Access Data Programmatically
```tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function MyComponent() {
  const pools = useQuery(api.pools.getRecent3Hours);
  return <div>{pools?.length} pools found</div>;
}
```

---

## ⚙️ Customization

### Change Sync Interval
Edit `/scripts/pool-monitor.ts`, line ~102:
```typescript
const REFRESH_INTERVAL = 1 * 60 * 60 * 1000; // 1 hour instead of 3
```

### Add Email Alerts
In `/scripts/pool-monitor.ts`, add after pool detection:
```typescript
if (newPools.size > 10) {
  sendEmail(`${newPools.size} new pools detected!`);
}
```

### Store Pool Metadata
The `monitoredPools` table has a `metadata` field. Enrich it:
```typescript
api.pools.updateMetadata({
  poolId: pool._id,
  metadata: {
    name: 'My Token',
    symbol: 'TOKEN',
    image: 'https://...'
  }
})
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `HELIUS_API_KEY error` | Check your API key from helius.dev |
| `POOL_MONITOR_SECRET error` | Make sure both monitor and app use same secret |
| No pools appearing | Wait a few minutes for actual pools to be created on Solana |
| Monitor won't start | Run `npm install` first |
| App won't load | Check you have Convex configured in your project |

---

## 📱 Mobile Ready

The app works great on mobile! The Pools tab automatically adapts.

---

## 🎓 Learn More

- Full setup guide: `POOL_MONITOR_SETUP.md`
- Implementation details: `POOL_IMPLEMENTATION.md`
- API reference: `POOL_MONITOR_SETUP.md` → Database Schema

---

## ✅ You're Done!

Your pool monitoring system is now:
- ✅ Listening to Meteora & Raydium
- ✅ Recording discoveries in your database
- ✅ Displaying live in your UI
- ✅ Syncing every 3 hours

Happy monitoring! 🎉
