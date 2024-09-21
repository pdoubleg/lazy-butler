/* eslint-disable n/no-process-env */
// src/utils/fileUtils.ts

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "../../data/prompts");
const KNOWLEDGE_BASE_DIR = path.join(DATA_DIR, "knowledge_base");

export const DEFAULT_PROMPT_FILE = process.env.DEFAULT_PROMPT_FILE || "prompt_concierge.txt";
export const DEFAULT_TOPIC = process.env.DEFAULT_TOPIC || "Legal Services Department Inquiries";

export const PROMPT_PATH = path.join(DATA_DIR, DEFAULT_PROMPT_FILE);
export const DOMAIN_KNOWLEDGE_PATH = path.join(KNOWLEDGE_BASE_DIR, "domain_knowledge.txt");
export const PREVIOUS_PREDICTIONS_PATH = path.join(KNOWLEDGE_BASE_DIR, "previous_completions.json");
export const VALID_LABELS_PATH = path.join(KNOWLEDGE_BASE_DIR, "valid_labels.json");

export const readFile = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    return "";
  }
};

export async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading JSON file at ${filePath}:`, error);
    return {} as T;
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const getValidLabels = (): Record<string, string> => {
  try {
    const data = fs.readFileSync(VALID_LABELS_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading valid labels from ${VALID_LABELS_PATH}:`, error);
    return {};
  }
};
