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
    const prompt = `You are an expert data analyst and researcher. Your task is to fulfill the user's request for a single company based on the data provided.

User Request: "${request}"

Company Information:
- Name: ${company.name}
- Headquarters: ${company.headquarters}
- Core Offering: ${company.offering}
- Category: ${company.category}
- Website (if available in offering): Analyze the core offering to find a potential website.

Based on the request and the company information, determine the new value for the column: "${targetColumn}".

IMPORTANT: Your response MUST be a JSON object with a single key "updatedValue". If you cannot find the information or are unsure, return an empty string for the "updatedValue", like this: { "updatedValue": "" }. Do not provide explanations or refuse to answer.`;

    try {
      const { output } = await ai.generate({
        prompt,
        model: model ? ai.model(model) : ai.model('gemini-1.5-flash-latest'),
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
