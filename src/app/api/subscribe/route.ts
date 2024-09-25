import { serve } from "@upstash/qstash/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { SubscriptionData } from "@/types";

// Define the main POST function
export const POST = async (request: NextRequest) => {
  try {
    // get body data from the request body
    const { email, frequency: freq, customFrequency } = await request.json();

    console.log("Email:", email);
    console.log("Frequency:", freq);
    console.log("Custom Frequency:", customFrequency);

    // Validate email and frequency before proceeding to the handler
    if (!email || !freq) {
      console.error("Email and frequency are required.");
      return NextResponse.json(
        { error: "Email and frequency are required." },
        { status: 400 }
      );
    }

    // Handle custom frequency
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

    // Create frequency number based on the selected frequency
    if (frequency === "daily") {
      frequency = "1";
    } else if (frequency === "weekly") {
      frequency = "7";
    } else if (frequency === "monthly") {
      frequency = "30";
    }

    const frequencyNumber = Number(frequency);

    // Validate frequency is a number
    if (isNaN(frequencyNumber) || frequencyNumber <= 0) {
      console.error("Invalid frequency value.");
      return NextResponse.json(
        { error: "Invalid frequency value." },
        { status: 400 }
      );
    }

    // Check if the email is already subscribed
    const exists = await checkSubscription(email);

    if (exists) {
      console.error("Email is already subscribed.");
      return NextResponse.json(
        { error: "Email is already subscribed." },
        { status: 400 }
      );
    }

    // Pass the request to the handler function with validated data
    const handler = serve<SubscriptionData>(async (context) => {
      // Store the subscription in Redis
      await context.run("add-user-to-redis", async () => {
        console.log("Adding user to Redis");
        await redis.set(
          `user:${email}`,
          JSON.stringify({ frequency: frequencyNumber })
        );
      });

      // Enqueue the workflow to send an email (using QStash)
      await context.run("send-email", async () => {
        console.log("Sending welcome email to", email);
        await sendEmail("Welcome to Upstash Newsletter!", email);
      });

      console.log("Subscription successful!");

      // We will send at most 5 newsletters so that we will not run the workflow forever in this example
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
          60 * 60 * 24 * frequencyNumber
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
        await context.run("send-email", async () => {
          console.log("Sending newsletter email to", email);
          await sendEmail(
            `
        Here is your daily newsletter!
        You are receiving this email because you subscribed to Upstash Newsletter.
        You can unsubscribe anytime by clicking the link in the email.
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

    // Execute the handler function
    await handler(request);

    // Return success response after handler execution
    return NextResponse.json({ message: "Subscription successful!" });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: "An error occurred during subscription." },
      { status: 500 }
    );
  }
};

// Function for sending email
async function sendEmail(message: string, email: string) {
  console.log(`Sending ${message} email to ${email}`);
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

// Function for checking if the user is still subscribed
async function checkSubscription(email: string) {
  const exists = await redis.exists(`user:${email}`);
  console.log("User is subscribed:", exists);
  return exists;
}
