import AIDashboard from '@/components/AIDashboard';
import Header from '@/components/Header';

export default function Lab() {
  return (
    <>
      <Header />
      <main className="min-h-screen p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">AAT – AI Aggregator</h1>
        <AIDashboard />
      </main>
    </>
  );
}
