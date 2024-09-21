// src/app.ts

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import predictionRoutes from "./routes/prediction-routes";

dotenv.config();

const app = express();
// eslint-disable-next-line n/no-process-env
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", predictionRoutes);

// Root Endpoint
app.get("/", (req, res) => {
  res.send("Prediction API is running.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
