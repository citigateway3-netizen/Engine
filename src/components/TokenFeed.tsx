"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Wifi, WifiOff, Filter, TrendingUp } from "lucide-react";
import TokenCard, { Token } from "./TokenCard";

interface TokenFeedProps {
  onAnalyzeToken?: (token: Token) => void;
}

type SortOption = "newest" | "marketcap" | "replies";
type FilterOption = "all" | "graduated" | "king";

export default function TokenFeed({ onAnalyzeToken }: TokenFeedProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [newTokenMints, setNewTokenMints] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const prevMintsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      const data = await res.json();

      if (data.success && Array.isArray(data.coins)) {
        const newMints = new Set<string>();
        const currentMints = new Set<string>(data.coins.map((c: Token) => c.mint));

        // Find truly new tokens (not in previous fetch)
        if (prevMintsRef.current.size > 0) {
          for (const mint of currentMints) {
            if (!prevMintsRef.current.has(mint)) {
              newMints.add(mint);
            }
          }
        }

        prevMintsRef.current = currentMints;
        setNewTokenMints(newMints);
        setTokens(data.coins);
        setIsMock(data.mock || false);
        setLastRefresh(new Date());
        setError(null);

        // Clear new badges after 10 seconds
        if (newMints.size > 0) {
          setTimeout(() => setNewTokenMints(new Set()), 10000);
        }
      }
    } catch (err) {
      setError("Failed to fetch tokens");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(fetchTokens, 15000); // Refresh every 15s
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive, fetchTokens]);

  const sortedAndFilteredTokens = tokens
    .filter((t) => {
      if (filterBy === "graduated") return t.complete;
      if (filterBy === "king") return !!t.king_of_the_hill_timestamp;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "marketcap") {
        return (b.usd_market_cap || 0) - (a.usd_market_cap || 0);
      }
      if (sortBy === "replies") {
        return (b.reply_count || 0) - (a.reply_count || 0);
      }
      return b.created_timestamp - a.created_timestamp;
    });

  const totalMarketCap = tokens.reduce(
    (sum, t) => sum + (t.usd_market_cap || 0),
    0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-white font-bold text-sm">pump.fun Live Feed</h2>
            {isMock && (
              <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                DEMO
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all ${
                isLive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-800 text-gray-500 border border-gray-700"
              }`}
            >
              {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isLive ? "LIVE" : "PAUSED"}
            </button>

            <button
              onClick={fetchTokens}
              className="text-gray-500 hover:text-white transition-colors p-1"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <TrendingUp size={10} className="text-green-400" />
            <span className="text-white font-semibold">{tokens.length}</span> tokens
          </span>
          <span>
            Total MCap:{" "}
            <span className="text-green-400 font-semibold">
              ${(totalMarketCap / 1_000_000).toFixed(2)}M
            </span>
          </span>
          <span>
            Updated:{" "}
            <span className="text-gray-400">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={10} className="text-gray-500" />
          <div className="flex gap-1">
            {(["all", "graduated", "king"] as FilterOption[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilterBy(f)}
                className={`text-xs px-2 py-0.5 rounded transition-all capitalize ${
                  filterBy === f
                    ? "bg-purple-600/30 text-purple-300 border border-purple-600/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            {(["newest", "marketcap", "replies"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`text-xs px-2 py-0.5 rounded transition-all capitalize ${
                  sortBy === s
                    ? "bg-blue-600/30 text-blue-300 border border-blue-600/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={20} className="text-purple-400 animate-spin" />
              <span className="text-gray-500 text-sm">
                Fetching latest launches...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <button
                onClick={fetchTokens}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Try again
              </button>
            </div>
          </div>
        ) : sortedAndFilteredTokens.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500 text-sm">No tokens found</p>
          </div>
        ) : (
          sortedAndFilteredTokens.map((token) => (
            <TokenCard
              key={token.mint}
              token={token}
              onAnalyze={onAnalyzeToken}
              isNew={newTokenMints.has(token.mint)}
            />
          ))
        )}
      </div>
    </div>
  );
}
