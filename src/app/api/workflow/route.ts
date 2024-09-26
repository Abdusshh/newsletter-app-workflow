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

  // We'll send at most 5 newsletters so that we don't run the workflow forever
  let newsletterCount = 5; // Number of newsletters to send

  while (true) {
    // Check if we have sent enough newsletters
    if (newsletterCount === 0) {
      console.log(
        "Sent desired number of newsletters. Stopping the workflow."
      );
      break;
    }

    // Wait for the frequency to send the next email
    await context.sleep(
      "wait-for-user-frequency",
      60 * 60 * 24 * Number(frequency) // Convert days to seconds
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
Here is your newsletter!
You are receiving this email because you subscribed to Upstash Newsletter.
You can unsubscribe anytime by clicking the link below.
You have ${newsletterCount} newsletters left.
<LINK TO UNSUBSCRIBE>
`,
        email
      );
    });

    newsletterCount--;
  }

  return;
});


// // Pass the request to the handler function with validated data
// const handler = serve<SubscriptionData>(async (context) => {
//     // Store the subscription in Redis
//     await context.run("add-user-to-redis", async () => {
//       console.log("Adding user to Redis");
//       await redis.set(
//         `user:${email}`,
//         JSON.stringify({ frequency: frequencyNumber })
//       );
//     });

//     // Enqueue the workflow to send an email (using QStash)
//     await context.run("send-email", async () => {
//       console.log("Sending welcome email to", email);
//       await sendEmail("Welcome to Upstash Newsletter!", email);
//     });


//     // We will send at most 5 newsletters so that we will not run the workflow forever in this example
//     let newsletterCount = 5; // Number of newsletters to send

//     while (true) {
//       // Check if we have sent enough newsletters
//       if (newsletterCount === 0) {
//         console.log(
//           "Sent desired number of newsletters. Stopping the workflow."
//         );
//         break;
//       }

//       // Wait for the frequency to send the next email
//       await context.sleep(
//         "wait-for-user-frequency",
//         60 * 60 * 24 * frequencyNumber
//       );

//       // Check if the user is still subscribed
//       const exists = await context.run(
//         "check-user-subscription",
//         async () => {
//           console.log("Checking if user is still subscribed");
//           return await checkSubscription(email);
//         }
//       );

//       if (!exists) {
//         console.log("User is not subscribed anymore. Stopping the workflow.");
//         break;
//       }

//       // Send the newsletter email
//       await context.run("send-email", async () => {
//         console.log("Sending newsletter email to", email);
//         await sendEmail(
//           `
//       Here is your daily newsletter!
//       You are receiving this email because you subscribed to Upstash Newsletter.
//       You can unsubscribe anytime by clicking the link in the email.
//       You have ${newsletterCount} newsletters left.
//       <LINK TO UNSUBSCRIBE>
//       `,
//           email
//         );
//       });

//       newsletterCount--;
//     }

//     return;
//   });

//   // Execute the handler function
//   await handler(request);