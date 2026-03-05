# Active Context: AI Workflow Agent

## Current State

**Project Status**: ✅ AI Workflow Agent Built

The project has been transformed from a Next.js starter template into a full AI workflow agent application with:
- Real-time pump.fun token launch tracking
- AI code writing agent (GPT-4o)
- AI research agent (Claude)
- AI workflow orchestration agent (GPT-4o)

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Installed Vercel AI SDK v6 (@ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/react, ai)
- [x] Installed Convex + @convex-dev/agent for persistent agent threads
- [x] Installed lucide-react, react-markdown, react-syntax-highlighter
- [x] Created Convex schema (tokenLaunches, agentSessions tables)
- [x] Created Convex agent definitions (codeAgent, researchAgent, workflowAgent)
- [x] Created Convex functions for agent sessions and token management
- [x] Created `/api/chat` route using Vercel AI SDK streamText + TextStreamChatTransport
- [x] Created `/api/tokens` route fetching pump.fun API with mock fallback
- [x] Created `TokenCard` component with risk assessment, social links, copy mint
- [x] Created `TokenFeed` component with live polling, filters, sorting
- [x] Created `AgentChat` component with 3 agent modes (workflow/code/research)
- [x] Created main dashboard page with split-panel layout
- [x] TypeScript: 0 errors
- [x] ESLint: 0 errors, 0 warnings
- [x] Fixed hydration error in `/api/tokens/route.ts` - replaced non-deterministic `Math.random()` and `Date.now()` with deterministic seeded values

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main dashboard with split panel | ✅ Ready |
| `src/app/layout.tsx` | Root layout with dark theme | ✅ Ready |
| `src/app/globals.css` | Global styles + animations | ✅ Ready |
| `src/app/api/chat/route.ts` | AI streaming chat API | ✅ Ready |
| `src/app/api/tokens/route.ts` | pump.fun token fetcher | ✅ Ready |
| `src/components/AgentChat.tsx` | AI chat interface (3 agents) | ✅ Ready |
| `src/components/TokenCard.tsx` | Token display card | ✅ Ready |
| `src/components/TokenFeed.tsx` | Live token feed | ✅ Ready |
| `convex/schema.ts` | Database schema | ✅ Ready |
| `convex/agents.ts` | Agent definitions | ✅ Ready |
| `convex/agentFunctions.ts` | Convex agent actions | ✅ Ready |
| `convex/tokens.ts` | Token CRUD functions | ✅ Ready |
| `convex/convex.config.ts` | Convex app config | ✅ Ready |
| `.env.local.example` | Environment variables template | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Architecture

### Frontend (Next.js App Router)
- **Dashboard**: Split panel - left (token feed) + right (AI chat)
- **Token Feed**: Real-time polling every 15s from pump.fun API
- **AI Chat**: 3 agent modes with streaming responses

### AI Agents (Vercel AI SDK v6)
- **Workflow Agent**: GPT-4o - orchestrates complex tasks
- **Code Agent**: GPT-4o - writes code in any language
- **Research Agent**: Claude Sonnet - deep research & analysis

### Backend (Convex)
- **Real-time DB**: Token launches, agent sessions
- **Agent Framework**: @convex-dev/agent for persistent threads
- **API**: pump.fun integration with mock fallback

## Environment Variables Required

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=prod:...
```

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-05 | Built full AI workflow agent with pump.fun tracker |
