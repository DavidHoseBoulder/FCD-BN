'use server';

/**
 * @fileOverview Analyzes a user's data cleaning request to determine the required output fields.
 *
 * - analyzeCleaningRequest - A function that takes a user's prompt and returns a list of data points to be generated.
 * - AnalyzeCleaningRequestInput - The input type for the analyzeCleaningRequest function.
 * - AnalyzeCleaningRequestOutput - The return type for the analyzeCleaningRequest function.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeCleaningRequestInput,
  AnalyzeCleaningRequestInputSchema,
  AnalyzeCleaningRequestOutput,
  AnalyzeCleaningRequestOutputSchema,
} from '@/lib/data-cleaning-types';

export async function analyzeCleaningRequest(input: AnalyzeCleaningRequestInput): Promise<AnalyzeCleaningRequestOutput> {
    return analyzeCleaningRequestFlow(input);
}

const analyzeCleaningRequestFlow = ai.defineFlow(
  {
    name: 'analyzeCleaningRequestFlow',
    inputSchema: AnalyzeCleaningRequestInputSchema,
    outputSchema: AnalyzeCleaningRequestOutputSchema,
  },
  async ({ request, model }) => {
    const prompt = `You are an expert at interpreting user requests and translating them into structured data schemas. A user will provide a prompt for enriching company data. Your task is to identify only the distinct pieces of information (data points) the user is asking the AI to *generate* or *create*. Ignore any data points mentioned as inputs or conditions.

User Request: "${request}"

Based on this request, identify the data points that need to be generated. For each data point, provide a short, descriptive, camelCase key.

Examples:
- User Request: "Find the estimated valuation and a confidence score." -> Output: { "dataPoints": ["estimatedValuation", "confidenceScore"] }
- User Request: "Based on employee count and location, find the CEO and what their LinkedIn profile URL is." -> Output: { "dataPoints": ["ceoName", "ceoLinkedInURL"] }
- User Request: "Generate a 1-paragraph summary of the company's core offering." -> Output: { "dataPoints": ["offeringSummary"] }

Return a JSON object containing a single key "dataPoints" which is an array of these camelCase strings.`;

    const { output } = await ai.generate({
      prompt,
      model: model,
      output: {
        schema: AnalyzeCleaningRequestOutputSchema,
      },
    });

    return output!;
  }
);
