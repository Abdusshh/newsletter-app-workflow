"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

export default function UnsubscribeForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formResponse, setFormResponse] = useState<{ success: boolean; message: string } | null>(null)
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      form.setValue("email", emailParam)
    }
  }, [searchParams, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setFormResponse(null)
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "An error occurred during unsubscription.")
      }

      setFormResponse({ success: true, message: "You have been unsubscribed successfully." })
    } catch (error) {
      console.error("Error unsubscribing:", error)
      setFormResponse({ success: false, message: error instanceof Error ? error.message : "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {formResponse && (
          <Alert variant={formResponse.success ? "default" : "destructive"}>
            <AlertTitle>{formResponse.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{formResponse.message}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="destructive" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Unsubscribe
        </Button>
      </form>
    </Form>
  )
}