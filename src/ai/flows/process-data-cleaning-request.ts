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
  console.log('processDataCleaningRequest: Starting with input:', input);
  const result = await dataCleaningFlow(input);
  console.log('processDataCleaningRequest: Received result from dataCleaningFlow:', result);

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

const cleaningPrompt = ai.definePrompt({
  name: 'dataCleaningPrompt',
  input: { schema: DataCleaningRequestInputSchema },
  output: { schema: DataCleaningRequestOutputSchema },
  prompt: `You are an expert data analyst and researcher. Your task is to fulfill the user's request for a single company based on the data provided.

User Request: "{{request}}"

Company Information:
- Name: {{company.name}}
- Headquarters: {{company.headquarters}}
- Core Offering: {{company.offering}}
- Category: {{company.category}}
- Website (if available in offering): Analyze the core offering to find a potential website.

Based on the request and the company information, determine the new value for the column: "{{targetColumn}}".

IMPORTANT: Your response MUST be a JSON object with a single key "updatedValue". If you cannot find the information or are unsure, return an empty string for the "updatedValue", like this: { "updatedValue": "" }. Do not provide explanations or refuse to answer.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const dataCleaningFlow = ai.defineFlow(
  {
    name: 'dataCleaningFlow',
    inputSchema: DataCleaningRequestInputSchema,
    outputSchema: DataCleaningRequestOutputSchema,
  },
  async (input) => {
    console.log('dataCleaningFlow: Sending input to cleaningPrompt:', input);
    try {
      const { output } = await cleaningPrompt(input);
      console.log('dataCleaningFlow: Received output from cleaningPrompt:', output);
      return output!;
    } catch (error) {
      console.error('dataCleaningFlow: Error during cleaningPrompt execution:', error);
      throw error; // Re-throw the error so it can be caught and handled by the caller
    }
  }
);