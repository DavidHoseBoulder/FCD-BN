'use server';

/**
 * @fileOverview Processes a data cleaning request for a list of companies.
 *
 * - processDataCleaningRequest - A function that takes a data cleaning request and updates company data.
 */

import { ai } from '@/ai/genkit';
import { updateSheetRow } from '@/services/sheets';
import {
  DataCleaningRequestInput,
  DataCleaningRequestInputSchema,
  DataCleaningRequestOutput,
  DataCleaningRequestOutputSchema
} from '@/lib/data-cleaning-types';

export async function processDataCleaningRequest(input: DataCleaningRequestInput): Promise<DataCleaningRequestOutput> {
  const result = await dataCleaningFlow(input);

  // The output from the AI flow is a record of { dataPoint: newValue }
  // We need to translate this back to { columnName: newValue } using the mapping
  const rowUpdates: Record<string, string> = {};
  for (const mapping of input.outputMappings) {
    if (result.updatedValues[mapping.dataPoint]) {
      rowUpdates[mapping.targetColumn] = result.updatedValues[mapping.dataPoint];
    }
  }

  if (Object.keys(rowUpdates).length > 0) {
    await updateSheetRow({
      companyId: input.company.id,
      updates: rowUpdates,
      headers: input.headers,
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
  async ({ request, outputMappings, company, model }) => {
    // Dynamically create a Zod schema for the AI output based on the requested data points
    const dynamicOutputSchema = z.object({
      updatedValues: z.object(
        outputMappings.reduce((acc, mapping) => {
          acc[mapping.dataPoint] = z.string().describe(`The generated value for the data point: '${mapping.dataPoint}'`);
          return acc;
        }, {} as Record<string, z.ZodString>)
      )
    });

    const requestedDataPoints = outputMappings.map(m => `'${m.dataPoint}'`).join(', ');

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
5.  Your final output must be a JSON object with a key "updatedValues". The value of "updatedValues" must be another JSON object containing the data points the user asked for.

The requested data points are: ${requestedDataPoints}.

IMPORTANT: If you cannot fulfill the request for a specific data point, return an empty string for its value. For example, if you cannot find the 'ceo', your output for that part should be: { "ceo": "" }. Do not provide explanations outside of the value strings.`;

    try {
      const { output } = await ai.generate({
        prompt,
        model: model,
        output: {
          schema: dynamicOutputSchema,
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
