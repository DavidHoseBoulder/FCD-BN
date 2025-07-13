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

Return only the updated value for the specified column. If you cannot find the information, return an empty string.`,
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
    const { output } = await cleaningPrompt(input);
    return output!;
  }
);
