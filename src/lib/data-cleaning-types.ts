import { z } from 'zod';
import { Company } from './data';

/**
 * @fileOverview Defines the data structures (schemas and types) for data cleaning operations.
 * This file separates the data definitions from the server-side logic to comply with
 * Next.js "use server" constraints.
 */

export const DataCleaningRequestInputSchema = z.object({
  request: z.string().describe('The user\'s request for data cleaning. e.g., "Find the LinkedIn URL for each company."'),
  targetColumn: z.string().describe('The name of the column in the Google Sheet to update.'),
  company: z.custom<Company>().describe('The company data to process.'),
  headers: z.array(z.string()).describe('The header row from the Google Sheet.'),
});
export type DataCleaningRequestInput = z.infer<typeof DataCleaningRequestInputSchema>;

export const DataCleaningRequestOutputSchema = z.object({
  updatedValue: z.string().describe('The new value to be placed in the target column for the company.'),
});
export type DataCleaningRequestOutput = z.infer<typeof DataCleaningRequestOutputSchema>;
