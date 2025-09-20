import ChatBox from "@/components/ChatBox";

export default function Lab() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Ask To the AAT AI</h1>
      <ChatBox />
    </main>
  );
}
import AIDashboard from "@/components/AIDashboard";

export default function Lab() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">AAT – AI Aggregator</h1>
      <AIDashboard />
    </main>
  );
}
