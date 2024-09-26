import SubscriptionForm from '@/components/SubscriptionForm';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Subscribe to Upstash Newsletter</h1>
      
      {/* Subscription Form */}
      <SubscriptionForm />
      
      {/* Unsubscribe Link */}
      <div className="mt-8">
        <p className="text-gray-600">
          Already subscribed and want to unsubscribe? 
          <Link href="/unsubscribe" className="text-red-500 hover:text-red-700 font-bold ml-2">
            Click here to unsubscribe
          </Link>
        </p>
      </div>
    </main>
  );
}
