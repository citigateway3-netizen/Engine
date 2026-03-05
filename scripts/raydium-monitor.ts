import WebSocket from 'ws';

const API_KEY = process.env.HELIUS_API_KEY;
const WS_URL = `wss://mainnet.helius-rpc.com?api-key=${API_KEY}`;
const RAYDIUM_PROGRAM = '675kPX9MHTjS2zt1qrNifVVwz6cqVKMQdypQneEány3'; // Raydium AMM

interface PoolData {
  signature: string;
  creator: string;
  mint: string;
  timestamp: number;
  source: 'raydium';
}

const newPools: Map<string, PoolData> = new Map();

function connectRaydiumMonitor() {
  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('[Raydium] Connected to Helius WebSocket');
    
    ws.send(JSON.stringify({
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
    
    // Keep alive ping
    setInterval(() => ws.ping(), 10_000);
    console.log('[Raydium] Subscribed to pool creation events');
  });

  ws.on('message', (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const result = payload.params?.result;
      if (!result) return;

      const logs = result.transaction.meta.logMessages || [];
      // Filter for Raydium pool creation events
      if (!logs.some((l: string) => l.includes('initialize2') || l.includes('InitializeMint'))) return;

      const sig = result.signature;
      const keys = result.transaction.transaction.message.accountKeys.map((k: any) => k.pubkey);
      
      const poolData: PoolData = {
        signature: sig,
        creator: keys[0], // Creator wallet
        mint: keys[1],    // New token mint
        timestamp: Date.now(),
        source: 'raydium'
      };

      newPools.set(sig, poolData);
      
      console.log('🆕 [Raydium] New Pool Created:');
      console.log(`   Transaction: ${sig}`);
      console.log(`   Creator: ${poolData.creator}`);
      console.log(`   Token Mint: ${poolData.mint}`);
    } catch (error) {
      console.error('[Raydium] Error processing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('[Raydium] WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('[Raydium] Connection closed, reconnecting in 5s...');
    setTimeout(() => connectRaydiumMonitor(), 5000);
  });
}

export { connectRaydiumMonitor, newPools };
