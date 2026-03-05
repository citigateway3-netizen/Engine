import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  createTextStreamResponse,
} from "ai";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages, agentType = "workflow" } = (await req.json()) as {
    messages: UIMessage[];
    agentType?: string;
  };

  // Convert UI messages to model messages
  const modelMessages = await convertToModelMessages(messages);

  let model;
  let systemPrompt;

  switch (agentType) {
    case "code":
      model = openai("gpt-4o");
      systemPrompt = `You are an expert software engineer and code writer. Your capabilities include:

1. Writing clean, well-documented code in any programming language
2. Explaining code clearly with comments and documentation  
3. Debugging and fixing code issues
4. Suggesting best practices and optimizations
5. Creating full applications, components, and utilities

When writing code:
- Always include proper error handling
- Add meaningful comments
- Follow language-specific conventions
- Provide explanations of what the code does
- Format code properly with correct indentation

Respond with code blocks using proper language tags (e.g., \`\`\`typescript, \`\`\`python, etc.)`;
      break;

    case "research":
      model = anthropic("claude-sonnet-4-5");
      systemPrompt = `You are an expert research analyst specializing in crypto, DeFi, and blockchain technology. Your capabilities include:

1. Analyzing topics in depth with comprehensive coverage
2. Synthesizing information from multiple perspectives
3. Providing factual, well-structured research reports
4. Analyzing crypto/DeFi projects, tokenomics, and market trends
5. Researching pump.fun tokens and Solana ecosystem

When researching:
- Structure your response with clear sections using markdown headers
- Provide key findings and insights
- Include relevant context and background
- Highlight risks and opportunities
- Be objective and balanced

For crypto research, analyze:
- Token fundamentals and use case
- Team and community signals
- Market dynamics and liquidity
- Risk factors (rug pull indicators, etc.)
- On-chain metrics when available`;
      break;

    default: // workflow
      model = openai("gpt-4o");
      systemPrompt = `You are an AI workflow orchestrator that coordinates complex multi-step tasks. You specialize in:

1. Breaking down complex requests into actionable steps
2. Coordinating code writing and research tasks
3. Analyzing pump.fun token launches and providing insights
4. Creating comprehensive reports combining code and research
5. Building automated workflows for crypto monitoring

When given a task:
- First understand the full scope
- Break it into clear numbered steps
- Execute each step methodically
- Combine results into a coherent output
- Provide actionable recommendations

For pump.fun analysis:
- Evaluate token metrics (market cap, liquidity, holders)
- Assess risk level (Low/Medium/High) with reasoning
- Identify patterns in successful launches
- Flag potential scams or rug pulls
- Suggest entry/exit strategies

You can also write code when needed to automate tasks or build tools.`;
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
  });

  return createTextStreamResponse({ textStream: result.textStream });
}
