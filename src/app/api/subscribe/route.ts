import { NextRequest, NextResponse } from "next/server";
import { checkSubscription } from "@/lib/redis";

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

    console.log("Subscription successful!");

    console.log("Enqueue the workflow");
    // Enqueue the workflow
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/workflow`, {
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
      } else {
        console.log("Workflow enqueued successfully");
      }
    })
    .catch((error) => {
      console.error("Error enqueuing workflow:", error);
    });

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
