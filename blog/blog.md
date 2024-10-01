---
title: "Building a Custom Newsletter App with Upstash Workflow and Redis"
slug: newsletter-workflow-redis-nextjs
authors: [abdullahenes]
tags: [nextjs, workflow, redis]
---

In this blog post, we'll walk through building a custom newsletter application using **Upstash Workflow**, and **Upstash Redis**. Users can subscribe to a newsletter by providing their email and selecting their preferred frequency—daily, weekly, monthly, or a custom number of days. They can also unsubscribe at any time. We'll leverage Upstash Workflow to handle asynchronous email sending without worrying about serverless function timeouts.

## Motivation

Dealing with long-running tasks in serverless environments can be challenging. Functions are typically limited to a few seconds, which can be insufficient for tasks like email scheduling. Upstash Workflow simplifies this process by allowing you to create persistent workflows that can run for extended periods without timing out. This makes it ideal for managing tasks like email scheduling, subscription management, and more.

### Prerequisites

- An Upstash account for Redis and QStash tokens.
- Basic understanding of Next.js applications.
- Optional: Vercel account for deployment.
- Optional: ngrok for local development with Upstash Workflow.

## Project Setup

We started by bootstrapping a new Next.js project using `create-next-app`:

```bash
npx create-next-app@latest --typescript newsletter-app
cd newsletter-app
```

This sets up a basic Next.js application with the necessary configuration. We then installed the required dependencies:

```bash
npm install @upstash/qstash @upstash/redis
```

## Directory Structure

Our directory structure will look like this:

- **`src/app/`**: Contains the main application components and pages.
- **`src/app/api/`**: Contains the API routes for subscription, unsubscription, and workflow.
- **`src/components/`**: Contains the subscription and unsubscription form components.
- **`src/lib/`**: Contains utility functions for Redis and email sending.
- **`src/types/`**: Contains TypeScript type definitions.

## Environment Variables

Create a `.env` file at the root of your project and add the following variables:

```env
QSTASH_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
EMAIL_SERVICE_URL=
NEXT_PUBLIC_BASE_URL=
```

- **QSTASH_TOKEN**: Your Upstash QStash token.
- **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN**: Your Upstash Redis credentials.
- **EMAIL_SERVICE_URL**: The endpoint of your email sending API.
- **NEXT_PUBLIC_BASE_URL**: The base URL of your deployed application (e.g., `https://your-app.vercel.app`).

You can also set `UPSTASH_WORKFLOW_URL` variable in your `.env` file for local development with your ngrok URL. To learn more about how to develop workflows locally with ngrok, refer to the [Upstash Documentation](https://upstash.com/docs/qstash/workflow/howto/local-development).

<Note type="info">
The `UPSTASH_WORKFLOW_URL` environment variable is only necessary for local development. In production, the `baseUrl` parameter is automatically set and can be omitted.
</Note>

## Subscription Form Component

The `SubscriptionForm` component allows users to subscribe to the newsletter and select their preferred frequency.

```tsx title="src/components/SubscriptionForm.tsx"
"use client";

import React, { useState } from "react";

export default function SubscriptionForm() {
  const [frequency, setFrequency] = useState("daily");
  const [showCustomFrequency, setShowCustomFrequency] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFrequency(value);
    setShowCustomFrequency(value === "custom");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const result = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(result.error || "An error occurred during subscription.");
      } else {
        setIsError(false);
        setMessage(result.message || "Subscription successful!");
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      setIsError(true);
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <form className="flex flex-col gap-4 text-gray-700" onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        placeholder="Your Email"
        required
        className="border p-2 rounded"
      />
      <select
        name="frequency"
        value={frequency}
        onChange={handleFrequencyChange}
        required
        className="border p-2 rounded text-gray-700"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="custom">Custom Amount of Days</option>
      </select>
      {showCustomFrequency && (
        <input
          type="number"
          name="customFrequency"
          placeholder="Enter number of days"
          min="1"
          className="border p-2 rounded text-gray-700"
          required
        />
      )}
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Subscribe
      </button>

      {message && (
        <p className={`mt-2 ${isError ? "text-red-500" : "text-green-500"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
```

**Key Points:**

- **State Management**: Manages frequency selection and handles custom frequency input.
- **Form Submission**: Sends a POST request to `/api/subscribe`.
- **User Feedback**: Displays success or error messages based on the response.

## Unsubscribe Form Component

The `UnsubscribeForm` component allows users to unsubscribe from the newsletter.

```tsx title="src/components/UnsubscribeForm.tsx"
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const UnsubscribeForm = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Pre-fill email from query parameter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage("You have been unsubscribed successfully.");
      } else {
        setIsError(true);
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setIsError(true);
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form className="flex flex-col gap-4 text-gray-700" onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your Email"
        required
        className="border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-red-500 hover:bg-red-700 text-white p-2 rounded"
      >
        Unsubscribe
      </button>

      {message && (
        <p className={`mt-2 ${isError ? "text-red-500" : "text-green-500"}`}>
          {message}
        </p>
      )}
    </form>
  );
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnsubscribeForm />
    </Suspense>
  );
}
```

**Key Points:**

- **Pre-filled Email**: Automatically fills the email field if provided in the query parameters. (Especially useful for the unsubscribe link in emails.)
- **Form Submission**: Sends a POST request to `/api/unsubscribe`.
- **User Feedback**: Displays success or error messages.

## Redis Utility Functions

We use Upstash Redis to store and manage subscription data. We store the user's email and subscription frequency. We also provide helper functions to retrieve user data, remove users, and check if a user is subscribed.

In order to use the Upstash Redis REST API, you need to create a Redis database on Upstash and obtain the REST URL and token. You can find more information on how to do this in the [Upstash Documentation](https://upstash.com/docs/redis/overall/getstarted).

```typescript title="src/lib/redis.ts"
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getUserFrequency(email: string): Promise<number | null> {
  const data = await redis.get(`user:${email}`);
  console.log("User data:", data);
  if (!data) return null;

  const parsed = JSON.parse(JSON.stringify(data));
  return parsed.frequency;
}

export async function removeUser(email: string): Promise<void> {
  await redis.del(`user:${email}`);
}

export async function checkSubscription(email: string): Promise<boolean> {
  return (await getUserFrequency(email)) !== null;
}
```

**Key Points:**

- **Redis Client**: Configured using environment variables.
- **Helper Functions**:
  - `getUserFrequency`: Retrieves a user's subscription frequency.
  - `removeUser`: Deletes a user's subscription.
  - `checkSubscription`: Checks if a user is subscribed.

## Email Sending Function

We created a custom function to send emails using our own email API that we developed in a separate blog post. To learn more about it, you can read our previous [Email Scheduler Blog](https://upstash.com/blog/email-scheduler-qstash-python).

```typescript title="src/lib/email.ts"
export async function sendEmail(message: string, email: string) {
  console.log(`Sending email to ${email}`);
  const url = process.env.EMAIL_SERVICE_URL;
  const payload = {
    to_email: email,
    subject: "Upstash Newsletter",
    content: message,
  };

  if (!url) {
    console.error("EMAIL_SERVICE_URL is not defined.");
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error("Failed to send email:", await response.text());
  }
}
```

**Key Points:**

- **Custom Email API**: Sends POST requests to a specified email service endpoint.
- **Error Handling**: Logs errors if the email fails to send.

## Type Definitions

We defined TypeScript types for our subscription data.

```typescript title="src/types/index.ts"
export type SubscriptionData = {
  email: string;
  frequency: string;
  customFrequency?: string;
};
```

## Subscribe API Route

Handles subscription requests and initiates the workflow.

```typescript title="src/app/api/subscribe/route.ts"
import { NextRequest, NextResponse } from "next/server";
import { checkSubscription } from "@/lib/redis";

export const POST = async (request: NextRequest) => {
  try {
    const { email, frequency: freq, customFrequency } = await request.json();

    console.log("Email:", email);
    console.log("Frequency:", freq);
    console.log("Custom Frequency:", customFrequency);

    if (!email || !freq) {
      console.error("Email and frequency are required.");
      return NextResponse.json(
        { error: "Email and frequency are required." },
        { status: 400 }
      );
    }

    let frequency = freq;
    if (frequency === "custom") {
      if (!customFrequency) {
        console.error("Custom frequency days are required.");
        return NextResponse.json(
          { error: "Custom frequency days are required." },
          { status: 400 }
        );
      }
      frequency = customFrequency;
    }

    if (frequency === "daily") {
      frequency = "1";
    } else if (frequency === "weekly") {
      frequency = "7";
    } else if (frequency === "monthly") {
      frequency = "30";
    }

    const frequencyNumber = Number(frequency);

    if (isNaN(frequencyNumber) || frequencyNumber <= 0) {
      console.error("Invalid frequency value.");
      return NextResponse.json(
        { error: "Invalid frequency value." },
        { status: 400 }
      );
    }

    const exists = await checkSubscription(email);

    if (exists) {
      console.error("Email is already subscribed.");
      return NextResponse.json(
        { error: "Email is already subscribed." },
        { status: 400 }
      );
    }

    console.log("Subscription successful!");

    console.log("Enqueue the workflow");
    // Enqueue the workflow
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/workflow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        frequency: frequencyNumber,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to enqueue workflow:", response.statusText);
          return NextResponse.json(
            { error: "Failed to enqueue workflow." },
            { status: 500 }
          );
        } else {
          console.log("Workflow enqueued successfully");
        }
      })
      .catch((error) => {
        console.error("Error enqueuing workflow:", error);
        return NextResponse.json(
          { error: "Error enqueuing workflow." },
          { status: 500 }
        );
      });

    return NextResponse.json({ message: "Subscription successful!" });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: "An error occurred during subscription." },
      { status: 500 }
    );
  }
};
```

**Key Points:**

- **Validation**: Ensures email and frequency are provided and valid.
- **Frequency Handling**: Converts frequency to a numerical value.
- **Workflow Initiation**: Enqueues the workflow using Upstash QStash.

## Unsubscribe API Route

Handles unsubscription requests and removes the user from Redis.

```typescript title="src/app/api/unsubscribe/route.ts"
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";

export const POST = async (request: NextRequest) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const userExists = await redis.exists(`user:${email}`);
    if (!userExists) {
      return NextResponse.json(
        { error: "Email is not subscribed." },
        { status: 400 }
      );
    }

    // Remove the user from Redis
    await redis.del(`user:${email}`);

    // Send an email to confirm unsubscription
    await sendEmail(
      "You have been unsubscribed from Upstash Newsletter.",
      email
    );

    return NextResponse.json({ message: "You have been unsubscribed." });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
};
```

**Key Points:**

- **Validation**: Checks if the email is provided and exists in Redis.
- **Unsubscription**: Deletes the user's data from Redis.
- **Confirmation**: Sends an email confirming the unsubscription.

## Workflow API Route

This is the core of our application.

When a user subscribes, a workflow is initiated to send newsletters based on the selected frequency. Here are the key steps:

1. Store the user's subscription data in Redis.
2. Send a welcome email to the user.
3. Initiate a loop and in the loop:
    - Get the user's current frequency to determine when to send the next email.
    - Wait for the frequency duration.
    - Check if the user is still subscribed.
    - Send the newsletter email and repeat the loop until the desired number of newsletters is sent.

We limit the number of newsletters sent in this project to ensure that the workflow stops after a certain number of emails.

```typescript title="src/app/api/workflow/route.ts"
import { serve } from "@upstash/qstash/nextjs";
import { redis, checkSubscription, getUserFrequency } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { SubscriptionData } from "@/types";

export const POST = serve<SubscriptionData>(async (context) => {
  const { email, frequency } = context.requestPayload;

  // Store the subscription in Redis
  await context.run("add-user-to-redis", async () => {
    console.log("Adding user to Redis");
    await redis.set(`user:${email}`, JSON.stringify({ frequency: frequency }));
  });

  // Send a welcome email
  await context.run("send-welcome-email", async () => {
    console.log("Sending welcome email to", email);
    await sendEmail("Welcome to Upstash Newsletter!", email);
  });

  // We'll send at most 3 newsletters to avoid an infinite loop
  let newsletterCount = 3;
  const blogPosts = [
    "https://upstash.com/blog/workflow-kafka",
    "https://upstash.com/blog/qstash-fifo-parallelism",
    "https://upstash.com/blog/introducing-vector-database",
  ];

  while (true) {
    if (newsletterCount === 0) {
      console.log("Sent desired number of newsletters. Stopping the workflow.");
      break;
    }

    // Get user's current frequency
    const currentFrequency = await context.run(
      "get-user-frequency",
      async () => {
        console.log("Getting user's frequency");
        return await getUserFrequency(email);
      }
    );

    if (!currentFrequency) {
      console.log("User is not subscribed anymore. Stopping the workflow.");
      break;
    }

    // Wait for the frequency to send the next email
    await context.sleep(
      "wait-for-user-frequency",
      60 * 60 * 24 * currentFrequency // Convert days to seconds
    );

    // Check if the user is still subscribed
    const exists = await context.run("check-user-subscription", async () => {
      console.log("Checking if user is still subscribed");
      return await checkSubscription(email);
    });

    if (!exists) {
      console.log("User is not subscribed anymore. Stopping the workflow.");
      break;
    }

    // Send the newsletter email
    await context.run("send-newsletter-email", async () => {
      console.log("Sending newsletter email to", email);
      await sendEmail(
        `
Read this newsletter's blog post: ${blogPosts[newsletterCount - 1]}

You are receiving this email because you subscribed to Upstash Newsletter.

You can unsubscribe anytime by clicking the link below.
You have ${newsletterCount} newsletters left.
      
Unsubscribe here: ${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${email}
        `,
        email
      );
    });

    newsletterCount--;
  }

  return;
});
```

**Key Points:**

- **Persistent Workflow**: Uses Upstash Workflow to manage long-running tasks without worrying about function timeouts.
- **Email Scheduling**: Sends emails based on the user's selected frequency.
- **Loop Control**: Limits the number of newsletters sent to avoid infinite loops.
- **Dynamic Content**: Includes links to blog posts in the emails.

Here is an example of a completed workflow of an user who subscribed, received a newsletter, and unsubscribed:

![Workflow Example](/blog/workflow-example.png)

You can acccss your workflows from the [Upstash Console](https://console.upstash.com/).

## Main Page Component

The main page where users can subscribe to the newsletter.

```tsx title="src/app/page.tsx"
import SubscriptionForm from "@/components/SubscriptionForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">
        Subscribe to Upstash Newsletter
      </h1>

      {/* Subscription Form */}
      <SubscriptionForm />

      {/* Unsubscribe Link */}
      <div className="mt-8">
        <p className="text-gray-600">
          Already subscribed and want to unsubscribe?
          <Link
            href="/unsubscribe"
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            Click here to unsubscribe
          </Link>
        </p>
      </div>
    </main>
  );
}
```

## Unsubscribe Page Component

The page where users can unsubscribe.

```tsx title="src/app/unsubscribe/page.tsx"
import UnsubscribePage from "@/components/UnsubscribeForm";

export default function UnsubscribeHome() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">
        Unsubscribe from Upstash Newsletter
      </h1>

      {/* Unsubscribe Form */}
      <UnsubscribePage />
    </main>
  );
}
```

## Conclusion

We've successfully built a custom newsletter application using Next.js, Upstash Workflow, and Upstash Redis. This setup allows users to subscribe and unsubscribe, and handles email scheduling based on user preferences—all without worrying about serverless function timeouts.

You can find the complete source code on [GitHub](https://github.com/Abdusshh/newsletter-app-workflow). Also feel free to check out the live demo [here](https://newsletter-app-workflow.vercel.app/).

<Note type="danger">
If you unsubscribe and subscribe back while the initial workflow is still alive and sleeping (i.e., waiting to send the next email), both workflows will continue to run due to the current simple design of the project. This is a bug, not a feature.
</Note>

For more information on Upstash Workflow, you can check out the [Upstash Documentation](https://upstash.com/docs/qstash/workflow/getstarted).

If you have any questions or need help, feel free to reach out to us on [Discord](https://upstash.com/discord). Also, check out the [Upstash Blog](https://upstash.com/blog) for more tutorials and use cases.
