/* eslint-disable n/no-process-env */
/* eslint-disable check-file/filename-naming-convention */
// src/utils/predictionUtils.ts

import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { performance } from "perf_hooks";
import { z } from "zod";
import {
  CompletionUsageSchema,
  MultiPredictSchema,
  PastPredictionEntrySchema,
  PredictionRequest,
  PredictionRequestSchema,
} from "../models/prediction";
import {
  DOMAIN_KNOWLEDGE_PATH,
  PREVIOUS_PREDICTIONS_PATH,
  PROMPT_PATH,
  readFile,
  readJSON,
  sleep,
  VALID_LABELS_PATH,
} from "./file-utils";
import { openai } from "./openai-client";

interface ValidLabels {
  [key: string]: string;


  }
  
export const buildModelCorpusData = async (): Promise<string[]> => {
  const sections: string[] = [];
  let currentSection = "";

  const data = readFile(DOMAIN_KNOWLEDGE_PATH);
  if (!data) {
    console.error("Failed to read domain knowledge data");
    return [];
  }
  console.log("Domain knowledge data loaded successfully");
  
  const lines = data.split("\n");

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = line;
    } else {
      currentSection += line;
    }
  });

  if (currentSection) {
    sections.push(currentSection.trim());
  }

  console.log("Model corpus data built. Number of sections:", sections.length);
  return sections;
};
  
export const createIdNameMapping = async (): Promise<ValidLabels> => {
    const mapping = await readJSON<ValidLabels>(VALID_LABELS_PATH);
    if (!mapping) {
      console.error("Failed to read valid labels");
      return {};
    }
    console.log("ID-Name mapping created: Success");
    console.log("Number of valid labels:", Object.keys(mapping).length);
    return mapping;
  };
  
  export const buildOmniPrompt = (
    inputValue: string,
    topic: string,
    previousPredictions: z.infer<typeof PastPredictionEntrySchema>,
    domainKnowledge: string
  ): string => {
    let prompt = readFile(PROMPT_PATH);
    const previousPredictionsStr = JSON.stringify(previousPredictions, null, 2);
  
    prompt = prompt.replace("{{topic}}", topic);
    prompt = prompt.replace("{{previous_predictions}}", previousPredictionsStr);
    prompt = prompt.replace("{{domain_knowledge}}", domainKnowledge);
    prompt = prompt.replace("{{input_value}}", inputValue);
  
    return prompt;
  };
  
  export const getEmbedding = async (text: string, model: string = "text-embedding-3-small"): Promise<number[]> => {
    try {
      const response = await openai.embeddings.create({
        input: text,
        model: model,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error getting embedding:", error);
      return [];
    }
  };
  
  export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const dotProduct = vecA.reduce((acc, val, idx) => acc + val * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (normA * normB);
  };
  
  export const rankDocuments = async (
    query: string,
    documents: string[],
    top_k: number = -1
  ): Promise<[string, number][]> => {
    const queryEmbedding = await getEmbedding(query);
    const docEmbeddingsPromises = documents.map((doc) => getEmbedding(doc));
    const docEmbeddings = await Promise.all(docEmbeddingsPromises);
  
    const similarities: [number, number][] = docEmbeddings.map((docEmb, idx) => [
      cosineSimilarity(queryEmbedding, docEmb),
      idx,
    ]);
  
    similarities.sort((a, b) => b[0] - a[0]);
  
    const limited = top_k === -1 ? similarities : similarities.slice(0, top_k);
  
    return limited.map(([score, idx]) => [documents[idx], score]);
  };


async function rankPastPredictions(
    query: string,
    pastPredictions: z.infer<typeof PastPredictionEntrySchema>[],
    topN: number
  ): Promise<z.infer<typeof PastPredictionEntrySchema>[]> {
    const queryEmbedding = await getEmbedding(query);

    const scoredPredictions = await Promise.all(pastPredictions.map(async (pred) => {
      let attempts = 0;
      const maxAttempts = 5;
      const delayMs = 1000;

      while (attempts < maxAttempts) {
        if (pred.input) {
          const predEmbedding = await getEmbedding(pred.input);
          const similarity = cosineSimilarity(queryEmbedding, predEmbedding);
          return { ...pred, similarity };
        }

        console.warn(`Attempt ${attempts + 1}: Waiting for user_input to arrive for prediction:`, pred);
        await sleep(delayMs);
        attempts++;
      }

      console.error(`Failed to get user_input after ${maxAttempts} attempts for prediction:`, pred);
      return { ...pred, similarity: 0 };
    }));

    // Group by department
    const groupedPredictions = scoredPredictions.reduce((acc, pred) => {
      if (!acc[pred.correct_department]) {
        acc[pred.correct_department] = [];
      }
      acc[pred.correct_department].push(pred);
      return acc;
    }, {} as Record<string, (z.infer<typeof PastPredictionEntrySchema> & { similarity: number })[]>);

    // Sort each group and take top N
    const topNPerDepartment = Object.values(groupedPredictions).flatMap(group => 
      group
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topN)
    );

    // Sort all top N predictions across departments
    return topNPerDepartment
      .sort((a, b) => b.similarity - a.similarity)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ similarity, ...rest }) => rest); // Remove similarity from final result
  }

  
  export const runSingleInference = async (query: string): Promise<PredictionRequest> => {
    const startTime = performance.now();
    
    try {
      // Build model corpus data
      const templateData = await buildModelCorpusData();
      
      // Check if templateData is populated
      if (!templateData || templateData.length === 0) {
        console.error("Template data is empty or null");
        throw new Error("Failed to build model corpus data");
      }
  
      console.log("Template data built. Number of sections:", templateData.length);
  
      // Create name to ID mapping
      const nameToIdMapping = await createIdNameMapping();
      console.log("Name-to-ID mapping created:", Object.keys(nameToIdMapping).length > 0 ? "Success" : "Failed");
      console.log("Number of valid labels:", Object.keys(nameToIdMapping).length);
  
      // Rank service descriptions by similarity to the query
      const sortedTemplateData = await rankDocuments(query, templateData, -1);
      console.log("Template data ranked:", sortedTemplateData ? "Success" : "Failed");
      console.log("Number of ranked documents:", sortedTemplateData.length);
      console.log("Top ranked document:", sortedTemplateData[0]);

      // Create domain knowledge using sorted service descriptions
      const domainKnowledge = sortedTemplateData.map(([doc]) => doc).join("\n");
      console.log("Domain knowledge:", domainKnowledge ? "Success" : "Failed");
      console.log("Domain knowledge length:", domainKnowledge.length);
  
      // Load previous predictions
      const previousCompletions = await readJSON<z.infer<typeof PastPredictionEntrySchema>[]>(PREVIOUS_PREDICTIONS_PATH);

      const sortedExamples: z.infer<typeof PastPredictionEntrySchema>[] = [];
      // Check if previousCompletions is populated
      if (!previousCompletions || previousCompletions.length === 0) {
      console.warn("No previous completions found or failed to load");
      // TODO: Add exception handling
      } else {
      console.log("Previous completions loaded. Count:", previousCompletions.length);
      
      // Rank past predictions by query similarity and take top n=1 per service
      const sortedExamples = await rankPastPredictions(query, previousCompletions, 1);
      
      if (sortedExamples && sortedExamples.length > 0) {
          console.log("Sorted examples: Success");
          console.log("Number of sorted examples:", sortedExamples.length);
          console.log("Top sorted example:", sortedExamples[0]);
      } else {
          console.warn("No sorted examples found or ranking failed");
      }
      }
  
      // Build prompt
      const prompt = buildOmniPrompt(query, process.env.DEFAULT_TOPIC || "", sortedExamples[0], domainKnowledge);
  
      type MultiPredict = z.infer<typeof MultiPredictSchema>;
      
      const oai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? undefined,
      });
      
      const client = Instructor({
        client: oai,
        mode: "FUNCTIONS"
      });

      async function getPredictions(prompt: string): Promise<MultiPredict> {
        try {
          const predictions = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
            response_model: { schema: MultiPredictSchema, name: "MultiPredict" },
            max_retries: 5 // This means we can re-ask the LLM up to 5 times
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any);

          return predictions as MultiPredict;
        } catch (e) {
          if (Array.isArray(e) && e[0] instanceof z.ZodError) {
            console.error("Validation error:", e[0].message);
          } else {
            console.error("Error in getPredictions:", e);
          }
          throw e; // Re-throw the error after logging
        }
      }

      const multiPredict = await getPredictions(prompt);

      // Initialize token usage
      // TODO: Figure out how to get the actual tokenUsage
      const tokenUsage: z.infer<typeof CompletionUsageSchema> = { 
        prompt_tokens: 0, 
        completion_tokens: 0, 
        total_tokens: 0 
      };

      let predictionRequest: z.infer<typeof PredictionRequestSchema>;

      const endTime = performance.now();
  
      // eslint-disable-next-line prefer-const
      predictionRequest = {
        user_query: query,
        model_output: multiPredict,
        token_usage: tokenUsage,
        model_name: "gpt-4o",
        run_time: (endTime - startTime) / 1000, // in seconds
      };
  
      return predictionRequest;
    } catch (error) {
      console.error("Error in runSingleInference:", error);
      throw error; // Re-throw the error after logging
    }
  };
