// src/app/api/workflow/route.ts
import { serve } from "@upstash/qstash/nextjs";
import { redis, checkSubscription, getUserFrequency } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { SubscriptionData } from "@/types";

export const POST = serve<SubscriptionData>(async (context) => {
  const { email, frequency } = context.requestPayload;

  // Store the subscription in Redis
  await context.run("add-user-to-redis", async () => {
    console.log("Adding user to Redis");
    await redis.set(
      `user:${email}`,
      JSON.stringify({ frequency: frequency })
    );
  });

  // Send a welcome email
  await context.run("send-welcome-email", async () => {
    console.log("Sending welcome email to", email);
    await sendEmail("Welcome to Upstash Newsletter!", email);
  });

  // We'll send at most 3 newsletters so that we don't run the workflow forever in this example
  let newsletterCount = 3; 
  const blogPosts = [
    "https://upstash.com/blog/workflow-kafka", 
    "https://upstash.com/blog/qstash-fifo-parallelism",
    "https://upstash.com/blog/introducing-vector-database",
  ];

  while (true) {
    // Check if we have sent enough newsletters
    if (newsletterCount === 0) {
      console.log(
        "Sent desired number of newsletters. Stopping the workflow."
      );
      break;
    }

    // Get user's current frequency
    const currentFrequency = await context.run("get-user-frequency", async () => {
      console.log("Getting user's frequency");
      return await getUserFrequency(email);
    });

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
    const exists = await context.run(
      "check-user-subscription",
      async () => {
        console.log("Checking if user is still subscribed");
        return await checkSubscription(email);
      }
    );

    if (!exists) {
      console.log("User is not subscribed anymore. Stopping the workflow.");
      break;
    }

    // Send the newsletter email
    await context.run("send-newsletter-email", async () => {
      console.log("Sending newsletter email to", email);
      await sendEmail(
        `
You can read our latest blog posts: ${blogPosts[newsletterCount - 1]}

You are receiving this email because you subscribed to Upstash Newsletter.

You can unsubscribe anytime by clicking the link below.
You have ${newsletterCount} newsletters left.
      
Unsubscribe here: ${process.env.NEXT_PUBLIC_BASE_URL}api/unsubscribe?email=${email}
      `,
        email      
      );
    });

    newsletterCount--;
  }

  return;
});
