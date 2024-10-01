"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"]),
  customFrequency: z.number().min(1, "Custom frequency must be at least 1 day").optional().or(z.literal(undefined)),
}).refine((data) => {
  if (data.frequency === "custom") {
    return data.customFrequency !== undefined;
  }
  return true;
}, {
  message: "Custom frequency is required when 'custom' is selected",
  path: ["customFrequency"],
});

export default function SubscriptionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formResponse, setFormResponse] = useState<{ success: boolean; message: string } | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      frequency: "daily",
    },
  })

  const { watch } = form
  const frequency = watch("frequency")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setFormResponse(null)
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "An error occurred during subscription.")
      }

      setFormResponse({ success: true, message: result.message || "You've been successfully subscribed!" })
      form.reset()
    } catch (error) {
      console.error("An unexpected error occurred:", error)
      setFormResponse({ success: false, message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." })
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone else.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {frequency === "custom" && (
          <FormField
            control={form.control}
            name="customFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Frequency (days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Subscribe
        </Button>
      </form>
    </Form>
  )
}