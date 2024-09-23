'use client';

import React, { useState } from 'react';

export default function SubscriptionForm() {
  const [frequency, setFrequency] = useState('daily');
  const [showCustomFrequency, setShowCustomFrequency] = useState(false);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFrequency(value);
    setShowCustomFrequency(value === 'custom');
  };

  return (
    <form
      className="flex flex-col gap-4 text-gray-700"
      action="/api/subscribe"
      method="POST"
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
        <option value="custom">Custom</option>
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
      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded"
      >
        Subscribe
      </button>
    </form>
  );
}
