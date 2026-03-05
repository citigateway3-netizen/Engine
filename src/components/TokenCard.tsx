"use client";

import { useState } from "react";
import {
  ExternalLink,
  Twitter,
  MessageCircle,
  Globe,
  TrendingUp,
  Crown,
  Zap,
  Copy,
  Check,
} from "lucide-react";

export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image_uri?: string;
  created_timestamp: number;
  creator: string;
  market_cap?: number;
  usd_market_cap?: number;
  complete?: boolean;
  twitter?: string | null;
  telegram?: string | null;
  website?: string | null;
  reply_count?: number;
  virtual_sol_reserves?: number;
  virtual_token_reserves?: number;
  king_of_the_hill_timestamp?: number | null;
}

interface TokenCardProps {
  token: Token;
  onAnalyze?: (token: Token) => void;
  isNew?: boolean;
}

function formatMarketCap(value?: number): string {
  if (!value) return "N/A";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getRiskLevel(token: Token): { level: string; color: string } {
  const mcap = token.usd_market_cap || 0;
  const replies = token.reply_count || 0;
  const hasSocials = !!(token.twitter || token.telegram || token.website);

  if (mcap > 100_000 && hasSocials && replies > 50) {
    return { level: "LOW", color: "text-green-400" };
  } else if (mcap > 10_000 || (hasSocials && replies > 10)) {
    return { level: "MEDIUM", color: "text-yellow-400" };
  }
  return { level: "HIGH", color: "text-red-400" };
}

export default function TokenCard({ token, onAnalyze, isNew }: TokenCardProps) {
  const [copied, setCopied] = useState(false);
  const risk = getRiskLevel(token);

  const copyMint = async () => {
    await navigator.clipboard.writeText(token.mint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateMint = (mint: string) =>
    `${mint.slice(0, 4)}...${mint.slice(-4)}`;

  return (
    <div
      className={`relative bg-gray-900 border rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 group ${
        isNew
          ? "border-green-500/60 shadow-lg shadow-green-500/10 animate-pulse-once"
          : "border-gray-700/50"
      } ${token.king_of_the_hill_timestamp ? "border-yellow-500/60" : ""}`}
    >
      {/* King of the Hill Badge */}
      {token.king_of_the_hill_timestamp && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Crown size={10} />
          KING
        </div>
      )}

      {/* New Badge */}
      {isNew && (
        <div className="absolute -top-2 left-3 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap size={10} />
          NEW
        </div>
      )}

      {/* Graduated Badge */}
      {token.complete && (
        <div className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
          GRADUATED
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Token Image */}
        <div className="flex-shrink-0">
          {token.image_uri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={token.image_uri}
              alt={token.name}
              className="w-12 h-12 rounded-lg object-cover bg-gray-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://ui-avatars.com/api/?name=${token.symbol}&background=7c3aed&color=fff&size=48`;
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-purple-900/50 flex items-center justify-center text-purple-300 font-bold text-sm">
              {token.symbol.slice(0, 3)}
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-sm truncate">
              {token.name}
            </h3>
            <span className="text-gray-400 text-xs bg-gray-800 px-1.5 py-0.5 rounded font-mono">
              ${token.symbol}
            </span>
          </div>

          {token.description && (
            <p className="text-gray-400 text-xs line-clamp-2 mb-2">
              {token.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp size={10} className="text-green-400" />
              <span className="text-green-400 font-semibold">
                {formatMarketCap(token.usd_market_cap || token.market_cap)}
              </span>
            </div>

            <span className="text-gray-600">•</span>

            <span className={`font-semibold ${risk.color}`}>
              {risk.level} RISK
            </span>

            <span className="text-gray-600">•</span>

            <span className="text-gray-500">
              {timeAgo(token.created_timestamp)}
            </span>

            {token.reply_count !== undefined && token.reply_count > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 flex items-center gap-1">
                  <MessageCircle size={10} />
                  {token.reply_count}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="mt-3 flex items-center justify-between">
        {/* Mint Address */}
        <button
          onClick={copyMint}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs font-mono transition-colors"
        >
          {copied ? (
            <Check size={10} className="text-green-400" />
          ) : (
            <Copy size={10} />
          )}
          {truncateMint(token.mint)}
        </button>

        {/* Social Links + Actions */}
        <div className="flex items-center gap-2">
          {token.twitter && (
            <a
              href={token.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Twitter size={12} />
            </a>
          )}
          {token.telegram && (
            <a
              href={token.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              <MessageCircle size={12} />
            </a>
          )}
          {token.website && (
            <a
              href={token.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-purple-400 transition-colors"
            >
              <Globe size={12} />
            </a>
          )}

          <a
            href={`https://pump.fun/${token.mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-green-400 transition-colors"
          >
            <ExternalLink size={12} />
          </a>

          {onAnalyze && (
            <button
              onClick={() => onAnalyze(token)}
              className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-2 py-0.5 rounded border border-purple-600/30 transition-all"
            >
              Analyze
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
