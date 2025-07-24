'use server';

/**
 * @fileOverview Processes a data cleaning request for a list of companies.
 *
 * - processDataCleaningRequest - A function that takes a data cleaning request and updates company data.
 */

import { ai } from '@/ai/genkit';
import { updateSheetCell } from '@/services/sheets';
import {
  DataCleaningRequestInput,
  DataCleaningRequestInputSchema,
  DataCleaningRequestOutput,
  DataCleaningRequestOutputSchema
} from '@/lib/data-cleaning-types';

export async function processDataCleaningRequest(input: DataCleaningRequestInput): Promise<DataCleaningRequestOutput> {
  const result = await dataCleaningFlow(input);

  if (result.updatedValue) {
    await updateSheetCell({
      companyId: input.company.id,
      columnName: input.targetColumn,
      newValue: result.updatedValue,
      headers: input.headers, // Pass headers here
    });
  }

  return result;
}

const dataCleaningFlow = ai.defineFlow(
  {
    name: 'dataCleaningFlow',
    inputSchema: DataCleaningRequestInputSchema,
    outputSchema: DataCleaningRequestOutputSchema,
  },
  async ({ request, targetColumn, company, headers, model }) => {
    const prompt = `You are a world-class financial analyst and due diligence expert at a top-tier M&A firm. Your task is to fulfill a research request for a single company based on the data provided. You must be resourceful and use the available data to make intelligent estimations if direct information is not available.

User Request: "${request}"

Company Information (from internal database):
- Company Name: ${company['Company Name']}
- Headquarters: ${company['Headquarters']}
- Core Offering: ${company['Core Offering']}
- Ecosystem Category: ${company['Ecosystem Category']}
- # Employees - High: ${company['# Employees - High']}
- URL: ${company['URL']}

Your Task:
1.  Carefully analyze the user's request.
2.  Review all the provided company information.
3.  Fulfill the request to the best of your ability. If the request requires external knowledge (e.g., "find valuation"), you must use the provided company information to *estimate* a reasonable answer.
4.  For example, if asked for a valuation, use factors like Ecosystem Category, Employee Count, and Headquarters location to derive a logical estimate. A B2B SaaS company in San Francisco with 100 employees will have a different valuation profile than a bootstrapped hardware company in a different region.
5.  Your final output for the column "${targetColumn}" should be a concise string. If you provide an estimated value, include your reasoning and a confidence score (Low, Medium, High). Example for a valuation request: "$50M - $75M (Estimate based on employee count and enterprise SaaS category. Confidence: Medium)"

IMPORTANT: Your response MUST be a JSON object with a single key "updatedValue". If you cannot fulfill the request or are unsure even after attempting an estimation, return an empty string for the "updatedValue", like this: { "updatedValue": "" }. Do not provide explanations outside of the 'updatedValue' string.`;

    try {
      const { output } = await ai.generate({
        prompt,
        model: model, // Corrected: Pass model string directly
        output: {
          schema: DataCleaningRequestOutputSchema,
        },
        config: {
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_ONLY_HIGH',
            },
          ],
        },
      });
      return output!;
    } catch (error) {
      console.error('dataCleaningFlow: Error during generation:', error);
      throw error; // Re-throw the error so it can be caught and handled by the caller
    }
  }
);
