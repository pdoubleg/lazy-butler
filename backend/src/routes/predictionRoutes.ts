/* eslint-disable check-file/filename-naming-convention */
// src/routes/predictionRoutes.ts

import express, { Request, Response } from "express";
import { z } from "zod";
import { PredictionRequestSchema } from "../models/Prediction";
import { runSingleInference } from "../utils/predictionUtils";

const router = express.Router();


router.post("/predict", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query must be a non-empty string." });
    }

    // Run inference
    const prediction = await runSingleInference(query);

    // Validate the prediction response
    const validatedPrediction = PredictionRequestSchema.parse(prediction);

    return res.json(validatedPrediction);
  } catch (error) {
    console.error("Error in /predict:", error);

    if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'replace')")) {
      return res.status(500).json({ error: "Error processing AI response. Please try again." });
    }

    if (error instanceof z.ZodError) {
      // Handle validation errors
      return res.status(400).json({
        error: "Validation Error",
        details: error.errors,
      });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
