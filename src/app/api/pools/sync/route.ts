import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface PoolData {
  id: string;
  type: 'meteora' | 'raydium';
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: string | number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pools, timestamp } = body as {
      pools: PoolData[];
      timestamp: number;
    };

    if (!pools || !Array.isArray(pools)) {
      return NextResponse.json(
        { error: 'Invalid pools format' },
        { status: 400 }
      );
    }

    console.log(`[API] Received ${pools.length} pools to sync`);

    // Store pools in Convex using the api helper
    const results = await Promise.all(
      pools.map(pool => {
        const discovered = typeof pool.discovered === 'string' 
          ? new Date(pool.discovered).getTime()
          : pool.discovered;
        
        return convex.mutation(api.pools.add, {
          type: pool.type,
          signature: pool.signature,
          creator: pool.creator,
          poolAddress: pool.poolAddress || undefined,
          mint: pool.mint || undefined,
          timestamp: pool.timestamp,
          discovered: discovered,
          syncedAt: Date.now()
        }).catch(error => {
          console.error(`Error storing pool ${pool.signature}:`, error);
          return null;
        });
      })
    );

    const successful = results.filter(r => r !== null).length;
    console.log(`[API] Successfully stored ${successful}/${pools.length} pools`);

    return NextResponse.json({
      success: true,
      stored: successful,
      total: pools.length,
      timestamp
    });
  } catch (error) {
    console.error('[API] Error processing pools sync:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch recent pools from Convex
    const recentPools = await convex.query(api.pools.getRecent3Hours);

    return NextResponse.json({
      success: true,
      pools: recentPools,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error fetching pools:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
