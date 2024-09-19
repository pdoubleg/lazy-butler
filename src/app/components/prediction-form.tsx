// src/components/PredictionForm.tsx

"use client";

import { PredictionRequest } from "@/types/prediction";
import axios from "axios";
import React, { useState } from "react";

const PredictionForm: React.FC = () => {
    const [query, setQuery] = useState("");
    const [prediction, setPrediction] = useState<PredictionRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setPrediction(null);
  
      try {
        const response = await axios.post("http://localhost:5000/api/predict", { query });
        
        setPrediction(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.response?.data?.error || "An error occurred.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Department Prediction</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          className="w-full p-2 border border-gray-300 rounded"
          rows={4}
          placeholder="Enter your query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        ></textarea>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {prediction && prediction.model_output && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Predictions:</h2>
          <ul>
            {prediction.model_output.predictions.map((pred, index) => (
              <li key={index} className="mb-2 p-2 border border-gray-200 rounded">
                <p>
                  <strong>Department:</strong> {pred.predicted_department} (ID: {pred.predicted_service_id})
                </p>
                <p>
                  <strong>Confidence:</strong> {pred.confidence}/10
                </p>
                {pred.chain_of_thought && (
                  <p>
                    <strong>Reasoning:</strong> {pred.chain_of_thought}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p>
              <strong>Model:</strong> {prediction.model_name}
            </p>
            <p>
              <strong>Runtime:</strong> {prediction.run_time?.toFixed(2)} seconds
            </p>
            <p>
              <strong>Total Tokens:</strong> {prediction.token_usage?.total_tokens}
            </p>
            <p>
              <strong>Cost:</strong> ${(prediction.token_usage?.total_tokens || 0) * 0.00002} {/* Example cost calculation */}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
