import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a new monitored pool
export const add = mutation({
  args: {
    type: v.union(v.literal("meteora"), v.literal("raydium")),
    signature: v.string(),
    creator: v.string(),
    poolAddress: v.optional(v.string()),
    mint: v.optional(v.string()),
    timestamp: v.number(),
    discovered: v.number(),
    syncedAt: v.number(),
  },
  async handler(ctx, args) {
    // Check if pool already exists
    const existing = await ctx.db
      .query("monitoredPools")
      .withIndex("by_signature", (q) => q.eq("signature", args.signature))
      .first();

    if (existing) {
      return existing._id;
    }

    // Store new pool
    const poolId = await ctx.db.insert("monitoredPools", {
      type: args.type,
      signature: args.signature,
      creator: args.creator,
      poolAddress: args.poolAddress,
      mint: args.mint,
      timestamp: args.timestamp,
      discovered: args.discovered,
      syncedAt: args.syncedAt,
    });

    return poolId;
  },
});

// Get recent pools
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(v.literal("meteora"), v.literal("raydium"))),
  },
  async handler(ctx, args) {
    const limit = args.limit || 50;
    let query = ctx.db
      .query("monitoredPools")
      .withIndex("by_discovered", (q) => q.gte("discovered", Date.now() - 24 * 60 * 60 * 1000)); // Last 24 hours

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    const pools = await query.order("desc").take(limit);
    return pools;
  },
});

// Get pools by type
export const getByType = query({
  args: {
    type: v.union(v.literal("meteora"), v.literal("raydium")),
    limit: v.optional(v.number()),
  },
  async handler(ctx, args) {
    const limit = args.limit || 30;
    const pools = await ctx.db
      .query("monitoredPools")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .take(limit);

    return pools;
  },
});

// Get pool by signature
export const getBySignature = query({
  args: { signature: v.string() },
  async handler(ctx, args) {
    const pool = await ctx.db
      .query("monitoredPools")
      .withIndex("by_signature", (q) => q.eq("signature", args.signature))
      .first();

    return pool;
  },
});

// Get pools discovered in last N hours
export const getRecent3Hours = query({
  args: {},
  async handler(ctx) {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    const pools = await ctx.db
      .query("monitoredPools")
      .withIndex("by_discovered", (q) => q.gte("discovered", threeHoursAgo))
      .order("desc")
      .take(100);

    return pools;
  },
});

// Get pool statistics
export const getStats = query({
  args: {},
  async handler(ctx) {
    const allPools = await ctx.db.query("monitoredPools").collect();

    const byType = allPools.reduce(
      (acc, pool) => {
        acc[pool.type] = (acc[pool.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    const recentPools = allPools.filter((p) => p.discovered > threeHoursAgo);

    return {
      total: allPools.length,
      byType,
      recentCount: recentPools.length,
      lastUpdated: Date.now(),
    };
  },
});

// Update pool metadata
export const updateMetadata = mutation({
  args: {
    poolId: v.id("monitoredPools"),
    metadata: v.object({
      name: v.optional(v.string()),
      symbol: v.optional(v.string()),
      decimals: v.optional(v.number()),
      image: v.optional(v.string()),
    }),
  },
  async handler(ctx, args) {
    const pool = await ctx.db.get(args.poolId);
    if (!pool) throw new Error("Pool not found");

    await ctx.db.patch(args.poolId, {
      metadata: args.metadata,
    });

    return args.poolId;
  },
});
