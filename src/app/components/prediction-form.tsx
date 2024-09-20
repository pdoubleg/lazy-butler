// src/components/PredictionForm.tsx

"use client";

import { PredictionRequest } from "@/types/prediction";
import { Card, CardBody, CardFooter, CardHeader, Divider, Skeleton } from "@nextui-org/react";
import axios from "axios";
import React, { useState } from "react";

// Skeleton component for loading state
const PredictionSkeleton: React.FC = () => (
  <Card className="mb-4">
    <CardHeader className="flex justify-between">
      <Skeleton className="h-8 w-1/3 rounded-lg"/>
      <Skeleton className="h-6 w-1/4 rounded-lg"/>
    </CardHeader>
    <Divider />
    <CardBody className="space-y-3">
      <Skeleton className="h-4 w-4/5 rounded-lg"/>
      <Skeleton className="h-4 w-3/5 rounded-lg"/>
      <Skeleton className="h-20 w-full rounded-lg"/>
    </CardBody>
  </Card>
);

const PredictionForm: React.FC = () => {
    const [query, setQuery] = useState("");
    const [predictions, setPredictions] = useState<PredictionRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
  
      try {
        const response = await axios.post("http://localhost:5000/api/predict", { query });
        setPredictions(prevPredictions => [response.data, ...prevPredictions]);
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

      {loading && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Loading new predictions...</h2>
          {[...Array(3)].map((_, index) => (
            <PredictionSkeleton key={index} />
          ))}
        </div>
      )}

      {predictions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Predictions:</h2>
          {predictions.map((prediction, batchIndex) => (
            <div key={batchIndex} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Batch {predictions.length - batchIndex}</h3>
              {prediction.model_output?.predictions.map((pred, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader className="flex justify-between">
                    <h3 className="text-lg font-semibold">Prediction {index + 1}</h3>
                    <span className="text-default-500">Confidence: {pred.confidence}/10</span>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <p><strong>Department:</strong> {pred.predicted_department}</p>
                    <p><strong>Service ID:</strong> {pred.predicted_service_id}</p>
                    {pred.chain_of_thought && (
                      <>
                        <Divider className="my-2" />
                        <p><strong>Reasoning:</strong> {pred.chain_of_thought}</p>
                      </>
                    )}
                  </CardBody>
                </Card>
              ))}
              
              <Card className="mt-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Prediction Summary</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                  <p><strong>Model:</strong> {prediction.model_name}</p>
                  <p><strong>Runtime:</strong> {prediction.run_time?.toFixed(2)} seconds</p>
                  <p><strong>Total Tokens:</strong> {prediction.token_usage?.total_tokens}</p>
                </CardBody>
                <Divider />
                <CardFooter>
                  <p><strong>Cost:</strong> ${(prediction.token_usage?.total_tokens || 0) * 0.00002}</p>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
