import SubscriptionForm from '@/components/SubscriptionForm';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Subscribe to Upstash Newsletter</h1>
      <SubscriptionForm />
    </main>
  );
}
