import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(
      "https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=created_timestamp&order=DESC&includeNsfw=false",
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`pump.fun API error: ${response.status}`);
    }

    const coins = await response.json();
    return NextResponse.json({ success: true, coins });
  } catch (error) {
    console.error("Error fetching pump.fun tokens:", error);

    // Return mock data as fallback
    const mockCoins = generateMockTokens();
    return NextResponse.json({ success: true, coins: mockCoins, mock: true });
  }
}

function generateMockTokens() {
  // Use deterministic data with seeded random to avoid hydration mismatch
  const seed = 12345;
  const names = [
    ["PEPE SOLANA", "PEPESOL", "The original Pepe on Solana. Community driven."],
    ["BONK INU", "BONKINU", "The dog coin of Solana. Much wow, very bonk."],
    ["MOON SHOT", "MOON", "To the moon and beyond! Deflationary token."],
    ["DOGE KILLER", "DOGEK", "The ultimate Doge killer on Solana."],
    ["SOLANA FROG", "SFROG", "Ribbit! The frog of Solana."],
    ["AI AGENT", "AIAGT", "Powering the AI agent revolution on Solana."],
    ["CHAD COIN", "CHAD", "Only chads hold this token. Diamond hands."],
    ["WOJAK", "WOJAK", "Feels good man. The emotion coin of crypto."],
    ["BASED APE", "BAPE", "The most based ape on Solana blockchain."],
    ["TURBO DOGE", "TURBO", "Faster than Doge, stronger than Shib."],
    ["SIGMA MALE", "SIGMA", "Sigma grindset. No cap, full send."],
    ["GIGACHAD", "GIGA", "The gigachad of Solana meme coins."],
    ["PUMP IT", "PUMP", "We only pump here. No dumps allowed."],
    ["LASER EYES", "LASER", "Bitcoin laser eyes but on Solana."],
    ["DIAMOND HANDS", "DIAM", "Never sell. Diamond hands forever."],
  ];

  // Deterministic random based on index
  const pseudoRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };

  return names.map(([name, symbol, description], i) => ({
    mint: `token${String(i).padStart(2, "0")}${`0`.repeat(30)}`,
    name,
    symbol,
    description,
    image_uri: `https://picsum.photos/seed/${symbol}/200/200`,
    created_timestamp: 1700000000000 - i * 1000 * 60 * 10,
    creator: `creator${String(i).padStart(2, "0")}${`0`.repeat(26)}`,
    market_cap: Math.floor(pseudoRandom(i) * 500000),
    usd_market_cap: Math.floor(pseudoRandom(i + 100) * 500000),
    complete: i % 5 === 0,
    twitter: i % 2 === 0 ? `https://twitter.com/${symbol.toLowerCase()}` : null,
    telegram: i % 3 === 0 ? `https://t.me/${symbol.toLowerCase()}` : null,
    website: i % 4 === 0 ? `https://${symbol.toLowerCase()}.io` : null,
    reply_count: Math.floor(pseudoRandom(i + 200) * 500),
    virtual_sol_reserves: Math.floor(pseudoRandom(i + 300) * 100),
    virtual_token_reserves: Math.floor(pseudoRandom(i + 400) * 1000000000),
    king_of_the_hill_timestamp: i === 0 ? 1700000000000 - 1000 * 60 * 10 : null,
  }));
}
