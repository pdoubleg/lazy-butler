/* eslint-disable check-file/filename-naming-convention */
// src/utils/openAIClient.ts

import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

export const openai = new OpenAI({
    // eslint-disable-next-line n/no-process-env
    apiKey: process.env.OPENAI_API_KEY,
  });
