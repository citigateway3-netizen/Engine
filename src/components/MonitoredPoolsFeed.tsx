'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useMemo } from 'react';

interface Pool {
  _id: string;
  type: 'meteora' | 'raydium';
  signature: string;
  creator: string;
  poolAddress?: string;
  mint?: string;
  timestamp: number;
  discovered: number;
  syncedAt: number;
}

export function MonitoredPoolsFeed() {
  const [activeTab, setActiveTab] = useState<'all' | 'meteora' | 'raydium'>('all');

  // Fetch recent pools
  const recentPools = useQuery(api.pools.getRecent3Hours) || [];
  const meteoraPools = useQuery(api.pools.getByType, { type: 'meteora' }) || [];
  const raydiumPools = useQuery(api.pools.getByType, { type: 'raydium' }) || [];
  const stats = useQuery(api.pools.getStats);

  const pools = useMemo(() => {
    if (activeTab === 'all') {
      return recentPools;
    } else if (activeTab === 'meteora') {
      return meteoraPools;
    } else {
      return raydiumPools;
    }
  }, [activeTab, recentPools, meteoraPools, raydiumPools]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Mock data for development/display when no real data
  const displayPools = pools.length > 0 ? pools : [
    {
      _id: '1',
      type: 'meteora' as const,
      signature: 'HNHPLSqtR3QBL2YZeP5pKqVjvHmVKJkVJNSqZLx2eSXXXXXXXXXXXXXXXXXXXXXX',
      creator: 'DuEkD5v5T4YJKZrZZjJQqKjS6P3WnQkZN1V2JmYkSJ1A',
      poolAddress: 'GFb8kkVVMWQqUH1gaBTfgd2VcXYgJVxgNqaFqVUVUVUV',
      timestamp: Date.now() - 300000,
      discovered: Date.now() - 300000,
      syncedAt: Date.now()
    },
    {
      _id: '2',
      type: 'raydium' as const,
      signature: 'KqMnPpRsUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx',
      creator: '2KqRs3TuVwXyZaBcDeF7ghIjKlMnOpQrStUvWxYzAbCd',
      mint: '4QvTsmZT8iB8gTeFzGHjVSVvzP8jQuekRZgq2CcUnVwV',
      timestamp: Date.now() - 600000,
      discovered: Date.now() - 600000,
      syncedAt: Date.now()
    },
    {
      _id: '3',
      type: 'meteora' as const,
      signature: 'XyZ9aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmN',
      creator: '3rTuVwXyZaBcDeFgHiJk5mnOpQrStUvWxYzAbCdEfGh',
      poolAddress: 'LmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaB',
      timestamp: Date.now() - 900000,
      discovered: Date.now() - 900000,
      syncedAt: Date.now()
    },
  ];

  return (
    <div className="w-full border border-slate-700 rounded-lg bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-700 p-4 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-lg">📊</span> Monitored Pools
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time WebSocket monitoring for Meteora & Raydium pools
            </p>
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{stats.total}</div>
              <div className="text-xs text-slate-400">Total Pools</div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.recentCount} in 3h
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4 bg-slate-800/30">
        {['all', 'meteora', 'raydium'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && (
              <span className="ml-2 text-xs bg-slate-700 px-2 py-1 rounded">
                {tab === 'meteora' ? meteoraPools.length : raydiumPools.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pool List */}
      <div className="max-h-96 overflow-y-auto">
        {displayPools.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No pools discovered yet</p>
            <p className="text-xs mt-2">Monitoring in progress...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {displayPools.map((pool) => (
              <div
                key={pool._id}
                className="p-3 hover:bg-slate-800/50 transition-colors border-l-4"
                style={{
                  borderLeftColor: pool.type === 'meteora' ? '#3b82f6' : '#10b981',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-1 rounded"
                        style={{
                          backgroundColor: pool.type === 'meteora' ? '#1e40af20' : '#065f4620',
                          color: pool.type === 'meteora' ? '#60a5fa' : '#10b981',
                        }}
                      >
                        {pool.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTime(pool.discovered)}
                      </span>
                    </div>

                    <div className="text-sm font-mono text-slate-300 break-all">
                      {pool.signature}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">Creator:</span>
                        <div className="text-slate-300 font-mono">
                          {truncateAddress(pool.creator)}
                        </div>
                      </div>
                      {pool.poolAddress && (
                        <div>
                          <span className="text-slate-500">Pool:</span>
                          <div className="text-slate-300 font-mono">
                            {truncateAddress(pool.poolAddress)}
                          </div>
                        </div>
                      )}
                      {pool.mint && (
                        <div>
                          <span className="text-slate-500">Mint:</span>
                          <div className="text-slate-300 font-mono">
                            {truncateAddress(pool.mint)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`https://solscan.io/tx/${pool.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-slate-700 px-4 py-2 bg-slate-800/30 text-xs text-slate-400 flex items-center justify-between">
        <div>
          {stats && (
            <>
              <span className="text-green-400">●</span> Meteora: {stats.byType.meteora || 0} |{' '}
              <span className="text-emerald-400">●</span> Raydium: {stats.byType.raydium || 0}
            </>
          )}
        </div>
        <div>Auto-refresh every 3h</div>
      </div>
    </div>
  );
}
