import Image from "next/image"
import UnsubscribeForm from "@/components/forms/UnsubscribeForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UnsubscribePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Unsubscribe
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            We're sorry to see you go
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <UnsubscribeForm />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Changed your mind?{" "}
            <Link href="/" passHref>
              <Button variant="link" className="p-0 h-auto font-normal">
                Return to subscription page
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