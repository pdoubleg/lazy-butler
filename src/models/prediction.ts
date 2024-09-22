import { getValidLabels } from "@/utils/file-utils";
import { z } from "zod";

// PastPredictionEntry Schema
export const PastPredictionEntrySchema = z.object({
  input: z.string().describe("The input query provided by the user."),
  correct_department: z.string().describe("The actual department associated with the user query."),
});

// Prediction Schema
export const PredictionSchema = z.object({
  chain_of_thought: z.string().describe("The reasoning process behind the prediction."),
  predicted_department: z.string().describe("The predicted department."),
  confidence: z.number().int().min(1).max(10).describe("Confidence score of the prediction (1-10)."),
  predicted_service_id: z.string().optional().describe("The service ID corresponding to the predicted department."),
})
  .refine((data) => {
    const validLabels = getValidLabels();
    const validDepartments = Object.values(validLabels).map((v) => v.trim().toLowerCase());
    return validDepartments.includes(data.predicted_department.trim().toLowerCase());
  }, {
    // If the predicted name does not match any of the valid labels, send error message and a list of valid options back to the LLM
    message: `Invalid predicted_department value. Please choose from the following options: ${  
      Object.values(getValidLabels()).join(", ")}`,
    path: ["predicted_department"],
  })
  .transform((data) => { 
    // Now that the name is valid we can safely map back to the ID
    const validLabels = getValidLabels();
    const entry = Object.entries(validLabels).find(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, val]) => val.trim().toLowerCase() === data.predicted_department.trim().toLowerCase()
    );
    if (entry) {
      data.predicted_service_id = entry[0];
    }
    return data;
  });

// MultiPredict Schema
export const MultiPredictSchema = z.object({
  predictions: z.array(PredictionSchema).min(1).describe("A list of predicted departments."),
}).transform((data) => {
  // Sort predictions by 'confidence' in descending order
  data.predictions.sort((a, b) => b.confidence - a.confidence);
  return data;
});

// CompletionUsage Schema
export const CompletionUsageSchema = z.object({
  prompt_tokens: z.number().describe("Number of tokens in the prompt."),
  completion_tokens: z.number().describe("Number of tokens in the completion."),
  total_tokens: z.number().describe("Total number of tokens used."),
});

// PredictionRequest Schema
export const PredictionRequestSchema = z.object({
  user_query: z.string().optional().describe("The user's input query."),
  model_output: MultiPredictSchema.optional().describe("The model's prediction output."),
  token_usage: CompletionUsageSchema.optional().describe("Token usage metrics."),
  model_name: z.string().optional().describe("Name of the model used for prediction."),
  run_time: z.number().optional().describe("Time taken to perform the prediction (in seconds)."),
});

// Infer TypeScript types from Zod schemas
export type PredictionRequest = z.infer<typeof PredictionRequestSchema>;
export type Prediction = z.infer<typeof PredictionSchema>;
  
  