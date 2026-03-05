import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query to get latest token launches
export const getLatestTokens = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("tokenLaunches")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

// Query to get a specific token
export const getToken = query({
  args: { mint: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tokenLaunches")
      .withIndex("by_mint", (q) => q.eq("mint", args.mint))
      .first();
  },
});

// Mutation to upsert a token launch
export const upsertToken = mutation({
  args: {
    mint: v.string(),
    name: v.string(),
    symbol: v.string(),
    description: v.optional(v.string()),
    imageUri: v.optional(v.string()),
    metadataUri: v.optional(v.string()),
    twitter: v.optional(v.string()),
    telegram: v.optional(v.string()),
    website: v.optional(v.string()),
    createdTimestamp: v.number(),
    creator: v.string(),
    marketCap: v.optional(v.number()),
    usdMarketCap: v.optional(v.number()),
    bondingCurveKey: v.optional(v.string()),
    vSolInBondingCurve: v.optional(v.number()),
    vTokensInBondingCurve: v.optional(v.number()),
    complete: v.optional(v.boolean()),
    raydiumPool: v.optional(v.string()),
    totalSupply: v.optional(v.number()),
    replyCount: v.optional(v.number()),
    lastReply: v.optional(v.number()),
    nsfw: v.optional(v.boolean()),
    showName: v.optional(v.boolean()),
    kingOfTheHillTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokenLaunches")
      .withIndex("by_mint", (q) => q.eq("mint", args.mint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("tokenLaunches", args);
    }
  },
});

// Action to fetch latest tokens from pump.fun API
export const fetchPumpFunTokens = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Fetch from pump.fun API - latest coins
      const response = await fetch(
        "https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false",
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`pump.fun API error: ${response.status}`);
      }

      const coins = await response.json();

      if (!Array.isArray(coins)) {
        throw new Error("Invalid response from pump.fun API");
      }

      // Save each token to the database
      let saved = 0;
      for (const coin of coins) {
        try {
          await ctx.runMutation(api.tokens.upsertToken, {
            mint: coin.mint,
            name: coin.name || "Unknown",
            symbol: coin.symbol || "???",
            description: coin.description,
            imageUri: coin.image_uri,
            metadataUri: coin.metadata_uri,
            twitter: coin.twitter,
            telegram: coin.telegram,
            website: coin.website,
            createdTimestamp: coin.created_timestamp || Date.now(),
            creator: coin.creator || "",
            marketCap: coin.market_cap,
            usdMarketCap: coin.usd_market_cap,
            bondingCurveKey: coin.bonding_curve,
            vSolInBondingCurve: coin.virtual_sol_reserves,
            vTokensInBondingCurve: coin.virtual_token_reserves,
            complete: coin.complete,
            raydiumPool: coin.raydium_pool,
            totalSupply: coin.total_supply,
            replyCount: coin.reply_count,
            lastReply: coin.last_reply,
            nsfw: coin.nsfw,
            showName: coin.show_name,
            kingOfTheHillTimestamp: coin.king_of_the_hill_timestamp,
          });
          saved++;
        } catch {
          // Skip individual token errors
        }
      }

      return { success: true, count: saved, total: coins.length };
    } catch (error) {
      console.error("Error fetching pump.fun tokens:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Action to seed with mock data for demo purposes
export const seedMockTokens = action({
  args: {},
  handler: async (ctx) => {
    const mockTokens = [
      {
        mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        name: "PEPE SOLANA",
        symbol: "PEPESOL",
        description: "The original Pepe on Solana. Community driven meme token.",
        imageUri: "https://cf-ipfs.com/ipfs/QmPepe",
        createdTimestamp: Date.now() - 1000 * 60 * 2,
        creator: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        marketCap: 45230.5,
        usdMarketCap: 45230.5,
        complete: false,
        twitter: "https://twitter.com/pepesol",
        telegram: "https://t.me/pepesol",
        replyCount: 42,
      },
      {
        mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        name: "BONK INU",
        symbol: "BONKINU",
        description: "The dog coin of Solana. Much wow, very bonk.",
        imageUri: "https://cf-ipfs.com/ipfs/QmBonk",
        createdTimestamp: Date.now() - 1000 * 60 * 5,
        creator: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
        marketCap: 128450.75,
        usdMarketCap: 128450.75,
        complete: false,
        twitter: "https://twitter.com/bonkinu",
        replyCount: 156,
      },
      {
        mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        name: "MOON SHOT",
        symbol: "MOON",
        description: "To the moon and beyond! Deflationary token with burn mechanics.",
        imageUri: "https://cf-ipfs.com/ipfs/QmMoon",
        createdTimestamp: Date.now() - 1000 * 60 * 8,
        creator: "7cVfgArCheMR6Cs4t6vz5rfnqd5ejMnbp7SqGKFoFNBY",
        marketCap: 8920.3,
        usdMarketCap: 8920.3,
        complete: false,
        replyCount: 23,
      },
      {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        name: "DOGE KILLER",
        symbol: "DOGEK",
        description: "The ultimate Doge killer on Solana blockchain.",
        imageUri: "https://cf-ipfs.com/ipfs/QmDoge",
        createdTimestamp: Date.now() - 1000 * 60 * 12,
        creator: "3h1zGmCwsRJnVk5BuRNMLsPaQu1y2aqXqXDWYCgrp5UG",
        marketCap: 67890.0,
        usdMarketCap: 67890.0,
        complete: false,
        telegram: "https://t.me/dogekiller",
        replyCount: 89,
      },
      {
        mint: "So11111111111111111111111111111111111111112",
        name: "SOLANA FROG",
        symbol: "SFROG",
        description: "Ribbit! The frog of Solana. Community meme token.",
        imageUri: "https://cf-ipfs.com/ipfs/QmFrog",
        createdTimestamp: Date.now() - 1000 * 60 * 15,
        creator: "2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdqc9",
        marketCap: 3450.8,
        usdMarketCap: 3450.8,
        complete: false,
        replyCount: 12,
      },
      {
        mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
        name: "AI AGENT TOKEN",
        symbol: "AIAGT",
        description: "Powering the AI agent revolution on Solana.",
        imageUri: "https://cf-ipfs.com/ipfs/QmAI",
        createdTimestamp: Date.now() - 1000 * 60 * 20,
        creator: "8szGkuLTAux9XMgZ2vtd39zAHygndX1LBTarNBm9Ya8",
        marketCap: 234567.9,
        usdMarketCap: 234567.9,
        complete: true,
        twitter: "https://twitter.com/aiagenttoken",
        telegram: "https://t.me/aiagenttoken",
        website: "https://aiagenttoken.io",
        replyCount: 445,
        kingOfTheHillTimestamp: Date.now() - 1000 * 60 * 10,
      },
    ];

    let saved = 0;
    for (const token of mockTokens) {
      await ctx.runMutation(api.tokens.upsertToken, token);
      saved++;
    }

    return { success: true, count: saved };
  },
});
