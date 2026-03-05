"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Send,
  Bot,
  User,
  Code2,
  Search,
  Workflow,
  Loader2,
  Copy,
  Check,
  Trash2,
  ChevronDown,
} from "lucide-react";

type AgentType = "workflow" | "code" | "research";

interface AgentChatProps {
  initialMessage?: string;
  defaultAgent?: AgentType;
}

const AGENT_CONFIG = {
  workflow: {
    name: "Workflow Agent",
    icon: Workflow,
    color: "text-purple-400",
    bg: "bg-purple-600/20",
    border: "border-purple-600/30",
    description: "Orchestrates complex multi-step tasks",
    placeholder: "Describe a complex task or workflow...",
    suggestions: [
      "Analyze the top pump.fun tokens and write a monitoring script",
      "Research Solana DeFi trends and create a summary report",
      "Build a token sniper bot for pump.fun launches",
      "Create a risk assessment framework for meme coins",
    ],
  },
  code: {
    name: "Code Agent",
    icon: Code2,
    color: "text-blue-400",
    bg: "bg-blue-600/20",
    border: "border-blue-600/30",
    description: "Writes and explains code in any language",
    placeholder: "Describe what code you need...",
    suggestions: [
      "Write a TypeScript function to fetch pump.fun tokens",
      "Create a React component for displaying token data",
      "Build a WebSocket listener for Solana transactions",
      "Write a Python script to analyze token patterns",
    ],
  },
  research: {
    name: "Research Agent",
    icon: Search,
    color: "text-green-400",
    bg: "bg-green-600/20",
    border: "border-green-600/30",
    description: "Deep research and analysis on any topic",
    placeholder: "What would you like to research?",
    suggestions: [
      "Research pump.fun tokenomics and bonding curve mechanics",
      "Analyze Solana meme coin market trends in 2024",
      "What are the red flags for pump.fun rug pulls?",
      "Compare pump.fun vs Raydium token launches",
    ],
  },
};

interface CodeBlockProps {
  language: string;
  children: string;
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 rounded-t-lg border border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button
          onClick={copy}
          className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? (
            <Check size={12} className="text-green-400" />
          ) : (
            <Copy size={12} />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0 0 8px 8px",
          border: "1px solid #374151",
          borderTop: "none",
          fontSize: "0.8rem",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

// Extract text content from a message parts array
function getTextFromParts(
  parts: Array<{ type: string; text?: string }> | undefined
): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join("");
}

export default function AgentChat({
  initialMessage,
  defaultAgent = "workflow",
}: AgentChatProps) {
  const [agentType, setAgentType] = useState<AgentType>(defaultAgent);
  const [showSuggestions, setShowSuggestions] = useState(() => !initialMessage);
  const [inputValue, setInputValue] = useState(() => initialMessage || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = AGENT_CONFIG[agentType];
  const AgentIcon = config.icon;

  // Create transport with body for agentType
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: "/api/chat",
        body: { agentType },
      }),
    [agentType]
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
    setInputValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Agent Selector Header */}
      <div className="flex-shrink-0 border-b border-gray-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {(Object.keys(AGENT_CONFIG) as AgentType[]).map((type) => {
              const cfg = AGENT_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setAgentType(type);
                    setShowSuggestions(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    agentType === type
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} border`
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={12} />
                  {cfg.name}
                </button>
              );
            })}
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="ml-auto text-gray-600 hover:text-red-400 transition-colors p-1"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500">{config.description}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
              >
                <AgentIcon size={16} className={config.color} />
              </div>
              <div className="bg-gray-900 rounded-xl rounded-tl-none p-3 max-w-lg">
                <p className="text-white text-sm font-medium mb-1">
                  {config.name} ready
                </p>
                <p className="text-gray-400 text-xs">{config.description}</p>
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <ChevronDown size={10} />
                Suggested prompts
              </p>
              <div className="grid grid-cols-1 gap-2">
                {config.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s)}
                    className="text-left text-xs text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg p-2.5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const textContent = getTextFromParts(
            message.parts as Array<{ type: string; text?: string }>
          );
          if (!textContent && message.role !== "user") return null;

          // For user messages, get text from parts
          const displayText = textContent;

          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === "user" ? "bg-gray-700" : config.bg
                }`}
              >
                {message.role === "user" ? (
                  <User size={14} className="text-gray-300" />
                ) : (
                  <AgentIcon size={14} className={config.color} />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-xl p-3 ${
                  message.role === "user"
                    ? "bg-gray-800 rounded-tr-none text-white"
                    : "bg-gray-900 rounded-tl-none"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm text-white">{displayText}</p>
                ) : (
                  <div className="text-sm text-gray-200 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline = !match;
                          return isInline ? (
                            <code
                              className="bg-gray-800 text-purple-300 px-1 py-0.5 rounded text-xs font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <CodeBlock language={match[1]}>
                              {String(children).replace(/\n$/, "")}
                            </CodeBlock>
                          );
                        },
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold text-white mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold text-white mb-2 mt-3">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold text-gray-200 mb-1 mt-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-300 text-sm mb-2 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 mb-2 text-gray-300 text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 mb-2 text-gray-300 text-sm">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-300 text-sm">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-white font-semibold">
                            {children}
                          </strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-purple-500 pl-3 text-gray-400 italic my-2">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {displayText}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
            >
              <AgentIcon size={14} className={config.color} />
            </div>
            <div className="bg-gray-900 rounded-xl rounded-tl-none p-3">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className={`${config.color} animate-spin`} />
                <span className="text-gray-400 text-xs">
                  {agentType === "code"
                    ? "Writing code..."
                    : agentType === "research"
                    ? "Researching..."
                    : "Processing workflow..."}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-800 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={config.placeholder}
              disabled={isLoading}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isLoading || !inputValue.trim()
                ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                : `${config.bg} ${config.color} hover:opacity-80 border ${config.border}`
            }`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2">
          <Bot size={10} className="text-gray-600" />
          <span className="text-xs text-gray-600">
            Powered by Vercel AI SDK +{" "}
            {agentType === "research" ? "Claude" : "GPT-4o"}
          </span>
        </div>
      </div>
    </div>
  );
}
