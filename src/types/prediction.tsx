import { z } from "zod";

export const PredictionSchema = z.object({
  chain_of_thought: z.string(),
  predicted_department: z.string(),
  confidence: z.number().int().min(1).max(10),
  predicted_service_id: z.string().optional(),
});

export const MultiPredictSchema = z.object({
  predictions: z.array(PredictionSchema).min(1),
}).transform((data) => {
  data.predictions.sort((a, b) => b.confidence - a.confidence);
  return data;
});

export const CompletionUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

export const PredictionRequestSchema = z.object({
  user_query: z.string(),
  ground_truth: z.string().optional(),
  ground_truth_id: z.string().optional(),
  model_output: MultiPredictSchema.optional(),
  token_usage: CompletionUsageSchema.optional(),
  model_name: z.string().optional(),
  run_time: z.number().optional(),
});

// Infer TypeScript types from Zod schemas
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
