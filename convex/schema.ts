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
