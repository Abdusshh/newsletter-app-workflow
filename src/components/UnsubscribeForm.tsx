'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const UnsubscribeForm = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // To display success/error messages
  const [isError, setIsError] = useState(false); // Track if the message is an error

  // Pre-fill email from query parameter
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    setIsError(false); // Reset error status

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
    <form
      className="flex flex-col gap-4 text-gray-700" // Style the same way as the Subscription form
      onSubmit={handleSubmit}
    >
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your Email"
        required
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-red-500 hover:bg-red-700 text-white p-2 rounded">
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

// Wrapping the form component in Suspense
const UnsubscribePage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <UnsubscribeForm />
  </Suspense>
);

export default UnsubscribePage;
