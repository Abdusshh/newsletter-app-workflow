// unsubscribe/page.tsx
import UnsubscribeForm from "@/components/UnsubscribeForm";

export default function UnsubscribePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Unsubscribe from Upstash Newsletter</h1>
      
      {/* Unsubscribe Form */}
      <UnsubscribeForm />
    </main>
  );
}
