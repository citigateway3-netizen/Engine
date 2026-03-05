/**
 * Pool Monitor - Orchestrates monitoring for Meteora and Raydium pools
 * Runs WebSocket connections and syncs data to backend every 3 hours
 */

import WebSocket from 'ws';

const API_KEY = process.env.HELIUS_API_KEY;
const WS_URL = `wss://mainnet.helius-rpc.com?api-key=${API_KEY}`;
const METEORA_PROGRAM = 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'; // Meteora DLMM
const RAYDIUM_PROGRAM = '675kPX9MHTjS2zt1qrNifVVwz6cqVKMQdypQneEány3'; // Raydium AMM

const REFRESH_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

interface PoolData {
  id: string;
  type: 'meteora' | 'raydium';
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: number;
}

const discoveredPools: Map<string, PoolData> = new Map();
let meteoraWs: WebSocket | null = null;
let raydiumWs: WebSocket | null = null;

function connectMeteoraMonitor() {
  console.log('[Meteora] Connecting to Helius WebSocket...');
  meteoraWs = new WebSocket(WS_URL);

  meteoraWs.on('open', () => {
    console.log('[Meteora] Connected, subscribing to pool creation events');
    
    meteoraWs?.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'transactionSubscribe',
      params: [
        { failed: false, accountInclude: [METEORA_PROGRAM] },
        { 
          commitment: 'confirmed', 
          encoding: 'jsonParsed',
          transactionDetails: 'full', 
          maxSupportedTransactionVersion: 0 
        }
      ]
    }));
    
    setInterval(() => meteoraWs?.ping(), 10000);
  });

  meteoraWs.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const result = payload.params?.result;
      if (!result) return;

      const logs = result.transaction?.meta?.logMessages || [];
      if (!logs.some((l: string) => l.includes('InitializeLbPair') || l.includes('CreatePool'))) return;

      const sig = result.signature;
      const accounts = result.transaction?.transaction?.message?.accountKeys || [];
      
      const poolData: PoolData = {
        id: sig,
        type: 'meteora',
        signature: sig,
        creator: accounts[0]?.pubkey || 'Unknown',
        poolAddress: accounts[1]?.pubkey || undefined,
        timestamp: Date.now(),
        discovered: Date.now()
      };

      discoveredPools.set(sig, poolData);
      console.log('🆕 [Meteora] Pool:', sig.slice(0, 8), '...');
    } catch (error) {
      // Silently handle parsing errors
    }
  });

  meteoraWs.on('error', (error) => {
    console.error('[Meteora] Error:', error.message);
  });

  meteoraWs.on('close', () => {
    console.log('[Meteora] Disconnected, reconnecting in 5s...');
    setTimeout(connectMeteoraMonitor, 5000);
  });
}

function connectRaydiumMonitor() {
  console.log('[Raydium] Connecting to Helius WebSocket...');
  raydiumWs = new WebSocket(WS_URL);

  raydiumWs.on('open', () => {
    console.log('[Raydium] Connected, subscribing to pool creation events');
    
    raydiumWs?.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'transactionSubscribe',
      params: [
        { failed: false, accountInclude: [RAYDIUM_PROGRAM] },
        { 
          commitment: 'confirmed', 
          encoding: 'jsonParsed',
          transactionDetails: 'full', 
          maxSupportedTransactionVersion: 0 
        }
      ]
    }));
    
    setInterval(() => raydiumWs?.ping(), 10000);
  });

  raydiumWs.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const result = payload.params?.result;
      if (!result) return;

      const logs = result.transaction?.meta?.logMessages || [];
      if (!logs.some((l: string) => l.includes('initialize2') || l.includes('InitializeMint'))) return;

      const sig = result.signature;
      const keys = result.transaction?.transaction?.message?.accountKeys?.map((k: any) => k.pubkey) || [];
      
      const poolData: PoolData = {
        id: sig,
        type: 'raydium',
        signature: sig,
        creator: keys[0] || 'Unknown',
        mint: keys[1] || undefined,
        timestamp: Date.now(),
        discovered: Date.now()
      };

      discoveredPools.set(sig, poolData);
      console.log('🆕 [Raydium] Pool:', sig.slice(0, 8), '...');
    } catch (error) {
      // Silently handle parsing errors
    }
  });

  raydiumWs.on('error', (error) => {
    console.error('[Raydium] Error:', error.message);
  });

  raydiumWs.on('close', () => {
    console.log('[Raydium] Disconnected, reconnecting in 5s...');
    setTimeout(connectRaydiumMonitor, 5000);
  });
}

async function syncPoolsWithBackend() {
  if (discoveredPools.size === 0) {
    console.log('[Sync] No new pools to sync');
    return;
  }

  const poolsToSync = Array.from(discoveredPools.values());
  console.log(`\n📊 Syncing ${poolsToSync.length} pools to backend...`);
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/pools/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pools: poolsToSync.map(p => ({
          id: p.id,
          type: p.type,
          signature: p.signature,
          creator: p.creator,
          poolAddress: p.poolAddress,
          mint: p.mint,
          timestamp: p.timestamp,
          discovered: new Date(p.discovered).toISOString()
        })),
        timestamp: Date.now()
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Synced ${result.stored} pools`);
    } else {
      const error = await response.json();
      console.error(`❌ Sync failed: ${response.status} - ${error.error}`);
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
}

function startMonitoring() {
  if (!API_KEY) {
    console.error('❌ HELIUS_API_KEY not set!');
    process.exit(1);
  }

  console.log('🚀 Starting Pool Monitor\n');
  
  connectMeteoraMonitor();
  connectRaydiumMonitor();

  setTimeout(syncPoolsWithBackend, 10000);
  setInterval(syncPoolsWithBackend, REFRESH_INTERVAL);

  setInterval(() => {
    console.log(`📈 Status: ${discoveredPools.size} pools discovered`);
  }, 15 * 60 * 1000);
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  meteoraWs?.close();
  raydiumWs?.close();
  process.exit(0);
});

startMonitoring();
