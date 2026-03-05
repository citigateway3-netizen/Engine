import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { codeAgent, researchAgent, workflowAgent } from "./agents";
import { api } from "./_generated/api";

// ============ Code Agent Functions ============

export const startCodeSession = action({
  args: {
    prompt: v.string(),
    language: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { thread, threadId } = await codeAgent.createThread(ctx, {});

    const result = await thread.generateText({
      prompt: args.language
        ? `Write ${args.language} code for: ${args.prompt}`
        : args.prompt,
    });

    // Save session
    await ctx.runMutation(api.agentFunctions.saveAgentSession, {
      sessionId: threadId,
      agentType: "code",
      title: args.prompt.slice(0, 50),
    });

    return {
      threadId,
      text: result.text,
    };
  },
});

export const continueCodeSession = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await codeAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    const result = await thread.generateText({
      prompt: args.prompt,
    });

    return {
      threadId: args.threadId,
      text: result.text,
    };
  },
});

// ============ Research Agent Functions ============

export const startResearchSession = action({
  args: {
    query: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { thread, threadId } = await researchAgent.createThread(ctx, {});

    const result = await thread.generateText({
      prompt: `Research and analyze: ${args.query}`,
    });

    await ctx.runMutation(api.agentFunctions.saveAgentSession, {
      sessionId: threadId,
      agentType: "research",
      title: args.query.slice(0, 50),
    });

    return {
      threadId,
      text: result.text,
    };
  },
});

export const continueResearchSession = action({
  args: {
    threadId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await researchAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    const result = await thread.generateText({
      prompt: args.query,
    });

    return {
      threadId: args.threadId,
      text: result.text,
    };
  },
});

// ============ Workflow Agent Functions ============

export const startWorkflowSession = action({
  args: {
    task: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { thread, threadId } = await workflowAgent.createThread(ctx, {});

    const prompt = args.context
      ? `Task: ${args.task}\n\nContext: ${args.context}`
      : args.task;

    const result = await thread.generateText({ prompt });

    await ctx.runMutation(api.agentFunctions.saveAgentSession, {
      sessionId: threadId,
      agentType: "workflow",
      title: args.task.slice(0, 50),
    });

    return {
      threadId,
      text: result.text,
    };
  },
});

export const continueWorkflowSession = action({
  args: {
    threadId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await workflowAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    const result = await thread.generateText({
      prompt: args.message,
    });

    return {
      threadId: args.threadId,
      text: result.text,
    };
  },
});

// Analyze a pump.fun token with the workflow agent
export const analyzeToken = action({
  args: {
    mint: v.string(),
    name: v.string(),
    symbol: v.string(),
    marketCap: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { thread, threadId } = await workflowAgent.createThread(ctx, {});

    const prompt = `Analyze this pump.fun token launch:
    
Name: ${args.name}
Symbol: ${args.symbol}
Mint Address: ${args.mint}
Market Cap: ${args.marketCap ? `$${args.marketCap.toFixed(2)}` : "Unknown"}
Description: ${args.description || "No description"}

Provide:
1. Risk assessment (Low/Medium/High)
2. Key observations about this token
3. Red flags or positive signals
4. Brief recommendation for traders`;

    const result = await thread.generateText({ prompt });

    return {
      threadId,
      analysis: result.text,
    };
  },
});

// ============ Database Mutations ============

export const saveAgentSession = mutation({
  args: {
    sessionId: v.string(),
    agentType: v.union(
      v.literal("code"),
      v.literal("research"),
      v.literal("workflow")
    ),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("agentSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: now });
    } else {
      await ctx.db.insert("agentSessions", {
        sessionId: args.sessionId,
        agentType: args.agentType,
        title: args.title,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getAgentSessions = query({
  args: {
    agentType: v.optional(
      v.union(
        v.literal("code"),
        v.literal("research"),
        v.literal("workflow")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.agentType) {
      return await ctx.db
        .query("agentSessions")
        .withIndex("by_type", (q) => q.eq("agentType", args.agentType!))
        .order("desc")
        .take(20);
    }
    return await ctx.db.query("agentSessions").order("desc").take(20);
  },
});
