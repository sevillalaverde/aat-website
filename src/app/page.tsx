// No 'Image' import needed, so it has been removed.

export default function HomePage() {
  return (
    // Main container with a custom gradient background
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white selection:bg-blue-500/30">
      
      {/* ===== HERO SECTION ===== */}
      <section className="flex flex-col items-center justify-center text-center w-full min-h-screen p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/30 via-black to-black">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 animate-fade-in-down">
            The AI Revolution is Fractured.
            <br />
            <span className="text-blue-400">The American AI Token Unifies It.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 animate-fade-in-up">
            One Platform. One Token. The combined power of America&apos;s leading AI models for every investor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#pitch-deck" // Placeholder link
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 duration-300"
            >
              View the Pitch Deck ➔
            </a>
            <a 
              href="#telegram" // Placeholder link
              className="text-gray-400 hover:text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors duration-300"
            >
              Join our Telegram →
            </a>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section id="problem" className="w-full bg-black py-20 px-8 border-t border-b border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Investor&apos;s Dilemma</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            In 2025, investors face information overload. You need multiple expensive AI subscriptions, and you can&apos;t trust any single source. This creates noise, risk, and missed opportunities.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Fragmented Tools</h3>
              <p className="text-gray-300">Juggling separate apps for real-time sentiment, data analysis, and summaries is inefficient and costly.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Risk of &quot;Hallucination&quot;</h3>
              <p className="text-gray-300">A single AI can provide biased or incorrect financial insights with no cross-verification.</p>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Inaccessible Power</h3>
              <p className="text-gray-300">Institutional-grade, multi-model analysis has been out of reach for retail investors—until now.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOLUTION SECTION ===== */}
      <section id="solution" className="w-full py-20 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Solution: The AI Aggregator</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            The American AI Token platform acts as a Master Router. It takes your single query and leverages the unique strengths of Grok, Gemini, and ChatGPT to produce one superior, verified answer.
          </p>
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
            <p className="text-xl md:text-2xl font-mono text-center text-white">
              [ User Query ] → [ AAT Master Router ] → [ Grok + Gemini + ChatGPT ] → [ Unified, Verified Answer ]
            </p>
          </div>
        </div>
      </section>
      
      {/* ===== TOKEN UTILITY SECTION ===== */}
      <section id="token" className="w-full bg-black py-20 px-8 border-t border-b border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">$AAT: The Key to Unified Intelligence</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Platform Access</h3>
                <p>Stake $AAT to unlock tiered access to the AI Aggregator, from basic analysis to alpha-tier institutional tools.</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Revenue Share</h3>
                <p>A percentage of all platform subscription fees is distributed back to $AAT stakers as a real yield.</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">DAO Governance</h3>
                <p>Your tokens are your vote. Govern the future of the protocol, from new AI integrations to treasury management.</p>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Deflationary</h3>
                <p>A portion of revenue is used to buy back and burn $AAT tokens, permanently reducing the total supply.</p>
              </div>
          </div>
        </div>
      </section>

      {/* ===== WHITELIST SECTION ===== */}
      <section id="whitelist" className="w-full py-20 px-8 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Pre-Sale Whitelist</h2>
          <p className="text-lg text-gray-400 mb-8">
            Be the first to get access to the $AAT token. Register your interest to be considered for a whitelist spot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input type="email" placeholder="Enter your email address" className="bg-gray-800 text-white px-4 py-3 rounded-md w-full border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md w-full sm:w-auto">
              Register
            </button>
          </div>
        </div>
      </section>
      
      {/* ===== FOOTER ===== */}
      <footer className="w-full py-8 px-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2025 The American AI Token. All Rights Reserved.</p>
          <p className="text-xs mt-2">Disclaimer: This is not financial advice. All investments carry risk. Do your own research.</p>
      </footer>

    </main>
  );
}