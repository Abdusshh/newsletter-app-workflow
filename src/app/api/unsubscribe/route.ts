import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis"; 
import { sendEmail } from "@/lib/email";

export const POST = async (request: NextRequest) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
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
    await sendEmail("You have been unsubscribed from Upstash Newsletter.", email);


    return NextResponse.json({ message: "You have been unsubscribed." });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
};
