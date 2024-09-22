import { PredictionRequestSchema } from "@/models/prediction";
import { runSingleInference } from "@/utils/prediction-utils";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query must be a non-empty string." }, { status: 400 });
    }

    const prediction = await runSingleInference(query);
    const validatedPrediction = PredictionRequestSchema.parse(prediction);

    return NextResponse.json(validatedPrediction);
  } catch (error) {
    console.error("Error in /api/predict:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
