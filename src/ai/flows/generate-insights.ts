'use server';

/**
 * @fileOverview Generates insights about company data from a Google Sheet.
 *
 * - generateInsights - A function that generates insights about company data.
 * - GenerateInsightsInput - The input type for the generateInsights function.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInsightsInputSchema = z.object({
  companyData: z.string().describe('A JSON string containing an array of company objects.'),
  model: z.string().optional().describe('The name of the model to use for generation.'),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

const GenerateInsightsOutputSchema = z.object({
  insights: z.string().describe('A summary of insights generated from the company data.'),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async ({ companyData, model }) => {
    const prompt = `You are an expert business analyst for the financial technology sector. Generate insights from the following company data. The data is in JSON format.

Data: ${companyData}

Provide a concise summary of the key trends, patterns, and actionable insights derived from the data. Focus on aspects like ecosystem category distribution, common headquarters locations, funding trends (e.g., bootstrapped vs. venture-backed), and employee count ranges.`;
    
    const { output } = await ai.generate({
      prompt,
      model: model, // Corrected: Pass model string directly
      output: {
        schema: GenerateInsightsOutputSchema,
      },
    });

    return output!;
  }
);
