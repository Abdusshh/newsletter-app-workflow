"use client";

import React, { useState } from "react";

export default function SubscriptionForm() {
  const [frequency, setFrequency] = useState("daily");
  const [showCustomFrequency, setShowCustomFrequency] = useState(false);
  const [message, setMessage] = useState(""); // To display success/error messages
  const [isError, setIsError] = useState(false); // Track if the message is an error

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFrequency(value);
    setShowCustomFrequency(value === "custom");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages
    setIsError(false);

    const formData = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        body: formData,
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
      setIsError(true);
      setMessage("An unexpected error occurred.");
    }
  };

  return (
    <form
      className="flex flex-col gap-4 text-gray-700"
      onSubmit={handleSubmit} // Using onSubmit to handle the form
    >
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
