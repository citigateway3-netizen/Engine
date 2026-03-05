import WebSocket from 'ws';

const API_KEY = process.env.HELIUS_API_KEY;
const WS_URL = `wss://mainnet.helius-rpc.com?api-key=${API_KEY}`;
const RAYDIUM_PROGRAM = '675kPX9MHTjS2zt1qrNifVVwz6cqVKMQdypQneEány3';

interface PoolData {
  id: string;
  type: 'raydium';
  signature: string;
  creator: string;
  mint?: string;
  timestamp: number;
  discovered: number;
}

const discoveredPools: Map<string, PoolData> = new Map();

async function syncPools() {
  if (discoveredPools.size === 0) return;

  const pools = Array.from(discoveredPools.values());
  console.log(`\n📊 Syncing ${pools.length} Raydium pools...`);
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/pools/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pools, timestamp: Date.now() })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Synced ${result.stored} pools`);
      discoveredPools.clear();
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
}

function start() {
  if (!API_KEY) {
    console.error('❌ HELIUS_API_KEY not set');
    process.exit(1);
  }

  console.log('🚀 Starting Raydium Pool Monitor...\n');
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to Helius');
    
    ws.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'transactionSubscribe',
      params: [
        { failed: false, accountInclude: [RAYDIUM_PROGRAM] },
        { commitment: 'confirmed', encoding: 'jsonParsed', transactionDetails: 'full', maxSupportedTransactionVersion: 0 }
      ]
    }));
    
    setInterval(() => ws.ping(), 10000);
  });

  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const result = payload.params?.result;
      if (!result) return;

      const logs = result.transaction?.meta?.logMessages || [];
      if (!logs.some((l: string) => l.includes('initialize2') || l.includes('InitializeMint'))) return;

      const sig = result.signature;
      const keys = result.transaction?.transaction?.message?.accountKeys?.map((k: any) => k.pubkey) || [];
      
      const pool: PoolData = {
        id: sig,
        type: 'raydium',
        signature: sig,
        creator: keys[0] || 'Unknown',
        mint: keys[1],
        timestamp: Date.now(),
        discovered: Date.now()
      };

      discoveredPools.set(sig, pool);
      console.log(`📍 New pool: ${sig.slice(0, 8)}...`);
    } catch (error) {
      // Silently handle
    }
  });

  ws.on('error', (error) => console.error('❌ Error:', error.message));
  ws.on('close', () => {
    console.log('⚠️ Disconnected, reconnecting...');
    setTimeout(start, 5000);
  });

  // Sync every 3 hours
  setInterval(syncPools, 3 * 60 * 60 * 1000);
  
  // Initial sync after 10s
  setTimeout(syncPools, 10000);
}

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down');
  process.exit(0);
});

start();
