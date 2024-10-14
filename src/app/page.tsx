import Link from "next/link"
import Image from "next/image"
import SubscriptionForm from "@/components/forms/SubscriptionForm"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Upstash Newsletter
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Stay updated with the latest from Upstash
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <SubscriptionForm />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already subscribed?{" "}
            <Link href="/unsubscribe" passHref>
              <Button variant="link" className="p-0 h-auto font-normal">
                Unsubscribe here
              </Button>
            </Link>
          </p>
        </div>
      </div>
      
      <footer className="mt-8 flex items-center justify-center">
        <p className="text-sm text-gray-500 mr-2">Powered by</p>
        <Image src="/upstash.png" alt="Upstash Logo" width={40} height={18} />
        <p className="text-sm text-gray-500 ml-2">upstash</p>
      </footer>
    </main>
  )
}