import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface PoolData {
  id: string;
  type: 'meteora' | 'raydium';
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: string;
}

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  const secret = process.env.POOL_MONITOR_SECRET;

  if (!secret || !authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

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

    // Store pools in Convex
    const results = await Promise.all(
      pools.map(pool =>
        convex.mutation('pools:add', {
          type: pool.type,
          signature: pool.signature,
          creator: pool.creator,
          poolAddress: pool.poolAddress || null,
          mint: pool.mint || null,
          timestamp: pool.timestamp,
          discovered: new Date(pool.discovered).getTime(),
          syncedAt: Date.now()
        }).catch(error => {
          console.error(`Error storing pool ${pool.signature}:`, error);
          return null;
        })
      )
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Fetch recent pools from Convex
    const recentPools = await convex.query('pools:getRecent', {
      limit: 50
    });

    return NextResponse.json({
      success: true,
      pools: recentPools,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Error fetching pools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
