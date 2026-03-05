/**
 * Pool Monitor - Orchestrates monitoring for Meteora and Raydium pools
 * Runs WebSocket connections and refreshes data every 3 hours
 */

import { connectMeteoraMonitor, newPools as meteoraPools } from './meteora-monitor';
import { connectRaydiumMonitor, newPools as raydiumPools } from './raydium-monitor';

const REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

interface AggregatedPool {
  id: string;
  type: 'meteora' | 'raydium';
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: Date;
}

const discoveredPools: Map<string, AggregatedPool> = new Map();

async function fetchPoolMetadata(signature: string) {
  try {
    const response = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { maxSupportedTransactionVersion: 0 }]
      })
    });

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error(`Error fetching transaction ${signature}:`, error);
    return null;
  }
}

async function syncPoolsWithBackend() {
  const poolsToSync: AggregatedPool[] = [];

  // Collect Meteora pools
  meteoraPools.forEach((pool, sig) => {
    if (!discoveredPools.has(sig)) {
      const aggregated: AggregatedPool = {
        id: sig,
        type: 'meteora',
        signature: pool.signature,
        creator: pool.creator,
        poolAddress: pool.poolAddress,
        timestamp: pool.timestamp,
        discovered: new Date()
      };
      discoveredPools.set(sig, aggregated);
      poolsToSync.push(aggregated);
    }
  });

  // Collect Raydium pools
  raydiumPools.forEach((pool, sig) => {
    if (!discoveredPools.has(sig)) {
      const aggregated: AggregatedPool = {
        id: sig,
        type: 'raydium',
        signature: pool.signature,
        creator: pool.creator,
        mint: pool.mint,
        timestamp: pool.timestamp,
        discovered: new Date()
      };
      discoveredPools.set(sig, aggregated);
      poolsToSync.push(aggregated);
    }
  });

  if (poolsToSync.length > 0) {
    console.log(`\n📊 Syncing ${poolsToSync.length} new pools to backend...`);
    
    try {
      // Send to your backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pools/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.POOL_MONITOR_SECRET}`
          },
          body: JSON.stringify({
            pools: poolsToSync,
            timestamp: Date.now()
          })
        }
      );

      if (response.ok) {
        console.log(`✅ Successfully synced ${poolsToSync.length} pools`);
      } else {
        console.error(`❌ Sync failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error syncing pools:', error);
    }
  }

  // Log current stats
  console.log(`\n📈 Pool Monitor Stats:`);
  console.log(`   Total Discovered: ${discoveredPools.size}`);
  console.log(`   Meteora Pools: ${meteoraPools.size}`);
  console.log(`   Raydium Pools: ${raydiumPools.size}`);
}

function startMonitoring() {
  console.log('🚀 Starting Pool Monitor...\n');
  
  // Start WebSocket connections
  connectMeteoraMonitor();
  connectRaydiumMonitor();

  // Initial sync after 10 seconds
  setTimeout(syncPoolsWithBackend, 10000);

  // Refresh and sync every 3 hours
  setInterval(syncPoolsWithBackend, REFRESH_INTERVAL);

  // Log stats every 15 minutes
  setInterval(() => {
    console.log(`\n📊 [${new Date().toISOString()}] Monitoring Status:`);
    console.log(`   Total Pools: ${discoveredPools.size}`);
    console.log(`   Meteora: ${meteoraPools.size} | Raydium: ${raydiumPools.size}`);
  }, 15 * 60 * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Pool Monitor...');
  process.exit(0);
});

startMonitoring();
