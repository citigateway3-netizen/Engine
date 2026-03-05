"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import TokenFeed from "@/components/TokenFeed";
import { Token } from "@/components/TokenCard";
import {
  Bot,
  Rocket,
  Code2,
  Search,
  Workflow,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";

type ActivePanel = "feed" | "agent";
type AgentType = "workflow" | "code" | "research";

export default function Home() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("feed");
  const [analyzeMessage, setAnalyzeMessage] = useState<string | undefined>();
  const [defaultAgent, setDefaultAgent] = useState<AgentType>("workflow");

  const handleAnalyzeToken = (token: Token) => {
    const message = `Analyze this pump.fun token:

**Name:** ${token.name} ($${token.symbol})
**Mint:** ${token.mint}
**Market Cap:** ${token.usd_market_cap ? `$${token.usd_market_cap.toFixed(2)}` : "Unknown"}
**Description:** ${token.description || "No description"}
**Socials:** ${[token.twitter && "Twitter", token.telegram && "Telegram", token.website && "Website"].filter(Boolean).join(", ") || "None"}
**Replies:** ${token.reply_count || 0}
**Status:** ${token.complete ? "Graduated to Raydium" : "Active on bonding curve"}
${token.king_of_the_hill_timestamp ? "**👑 King of the Hill**" : ""}

Please provide a comprehensive risk assessment and trading analysis.`;

    setAnalyzeMessage(message);
    setDefaultAgent("workflow");
    setActivePanel("agent");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Navigation */}
      <header className="flex-shrink-0 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">
                AI Workflow Agent
              </h1>
              <p className="text-xs text-gray-500 leading-none mt-0.5">
                pump.fun + Code + Research
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Live</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Activity size={10} className="text-purple-400" />
              <span>AI Ready</span>
            </div>
          </div>

          {/* Mobile Panel Toggle */}
          <div className="flex md:hidden gap-1 bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setActivePanel("feed")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                activePanel === "feed"
                  ? "bg-green-600/20 text-green-400 border border-green-600/30"
                  : "text-gray-500"
              }`}
            >
              <Rocket size={10} />
              Feed
            </button>
            <button
              onClick={() => setActivePanel("agent")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                activePanel === "agent"
                  ? "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                  : "text-gray-500"
              }`}
            >
              <Bot size={10} />
              Agent
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
          <FeaturePill
            icon={<Rocket size={10} />}
            label="pump.fun Live"
            color="green"
          />
          <ChevronRight size={10} className="text-gray-700 flex-shrink-0" />
          <FeaturePill
            icon={<Workflow size={10} />}
            label="Workflow Agent"
            color="purple"
          />
          <ChevronRight size={10} className="text-gray-700 flex-shrink-0" />
          <FeaturePill
            icon={<Code2 size={10} />}
            label="Code Writer"
            color="blue"
          />
          <ChevronRight size={10} className="text-gray-700 flex-shrink-0" />
          <FeaturePill
            icon={<Search size={10} />}
            label="Research"
            color="green"
          />
          <ChevronRight size={10} className="text-gray-700 flex-shrink-0" />
          <FeaturePill
            icon={<Zap size={10} />}
            label="Vercel AI SDK"
            color="yellow"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Token Feed */}
        <div
          className={`${
            activePanel === "feed" ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-[420px] lg:w-[480px] border-r border-gray-800 flex-shrink-0 overflow-hidden`}
        >
          <TokenFeed onAnalyzeToken={handleAnalyzeToken} />
        </div>

        {/* Right Panel: AI Agent */}
        <div
          className={`${
            activePanel === "agent" ? "flex" : "hidden"
          } md:flex flex-col flex-1 overflow-hidden`}
        >
          {/* Agent Quick Actions */}
          <div className="flex-shrink-0 border-b border-gray-800 bg-gray-950 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Quick switch:</span>
              {(["workflow", "code", "research"] as AgentType[]).map((type) => {
                const icons = {
                  workflow: <Workflow size={10} />,
                  code: <Code2 size={10} />,
                  research: <Search size={10} />,
                };
                const colors = {
                  workflow: "text-purple-400 bg-purple-600/10 border-purple-600/20",
                  code: "text-blue-400 bg-blue-600/10 border-blue-600/20",
                  research: "text-green-400 bg-green-600/10 border-green-600/20",
                };
                return (
                  <button
                    key={type}
                    onClick={() => setDefaultAgent(type)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all capitalize ${
                      defaultAgent === type
                        ? colors[type]
                        : "text-gray-600 border-transparent hover:text-gray-400"
                    }`}
                  >
                    {icons[type]}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <AgentChat
              key={`${defaultAgent}-${analyzeMessage}`}
              initialMessage={analyzeMessage}
              defaultAgent={defaultAgent}
            />
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="flex-shrink-0 border-t border-gray-800 bg-gray-950 px-4 py-1.5">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              pump.fun API
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Vercel AI SDK
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Convex Agent
            </span>
          </div>
          <span>Built with Next.js 16 + Tailwind CSS 4</span>
        </div>
      </footer>
    </div>
  );
}

function FeaturePill({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: "green" | "purple" | "blue" | "yellow";
}) {
  const colors = {
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <div
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${colors[color]}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
