import WebSocket from 'ws';

const API_KEY = process.env.HELIUS_API_KEY;
const WS_URL = `wss://mainnet.helius-rpc.com?api-key=${API_KEY}`;
const METEORA_PROGRAM = 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'; // Meteora DLMM

interface PoolData {
  signature: string;
  poolAddress: string;
  creator: string;
  timestamp: number;
  source: 'meteora';
}

const newPools: Map<string, PoolData> = new Map();

function connectMeteoraMonitor() {
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('[Meteora] Connected to Helius WebSocket');
    
    ws.send(JSON.stringify({
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
    
    // Keep alive ping
    setInterval(() => ws.ping(), 10_000);
    console.log('[Meteora] Subscribed to pool creation events');
  });

  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const result = payload.params?.result;
      if (!result) return;

      const logs = result.transaction.meta.logMessages || [];
      // Look for Meteora pool creation logs
      if (!logs.some((l: string) => l.includes('InitializeLbPair') || l.includes('CreatePool'))) return;

      const sig = result.signature;
      const accounts = result.transaction.transaction.message.accountKeys;
      
      const poolData: PoolData = {
        signature: sig,
        poolAddress: accounts[1]?.pubkey || 'Unknown',
        creator: accounts[0]?.pubkey || 'Unknown',
        timestamp: Date.now(),
        source: 'meteora'
      };

      newPools.set(sig, poolData);
      
      console.log('🆕 [Meteora] New Pool Created:');
      console.log(`   Transaction: ${sig}`);
      console.log(`   Pool: ${poolData.poolAddress}`);
      console.log(`   Creator: ${poolData.creator}`);
    } catch (error) {
      console.error('[Meteora] Error processing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('[Meteora] WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('[Meteora] Connection closed, reconnecting in 5s...');
    setTimeout(() => connectMeteoraMonitor(), 5000);
  });
}

export { connectMeteoraMonitor, newPools };
