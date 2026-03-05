import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Token launches from pump.fun
  tokenLaunches: defineTable({
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
  })
    .index("by_created", ["createdTimestamp"])
    .index("by_mint", ["mint"]),

  // Monitored pools from Meteora and Raydium
  monitoredPools: defineTable({
    type: v.union(v.literal("meteora"), v.literal("raydium")),
    signature: v.string(),
    creator: v.string(),
    poolAddress: v.optional(v.string()),
    mint: v.optional(v.string()),
    timestamp: v.number(),
    discovered: v.number(),
    syncedAt: v.number(),
    metadata: v.optional(
      v.object({
        name: v.optional(v.string()),
        symbol: v.optional(v.string()),
        decimals: v.optional(v.number()),
        image: v.optional(v.string()),
      })
    ),
  })
    .index("by_signature", ["signature"])
    .index("by_discovered", ["discovered"])
    .index("by_type", ["type"]),

  // Agent sessions/threads
  agentSessions: defineTable({
    sessionId: v.string(),
    agentType: v.union(
      v.literal("code"),
      v.literal("research"),
      v.literal("workflow")
    ),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_type", ["agentType"]),
});
