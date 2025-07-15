export type Company = {
  id: number | string; // Use string | number to accommodate string IDs if needed
  "Company Name": string;
  'Ecosystem Category'?: string;
  'LinkedIn URL'?: string; // Added LinkedIn URL back
  [key: string]: any; // Use 'any' or a more specific union type if you know the other possible value types
};

export type CompanyDataCleaning = {
  // Define properties for your data cleaning type if it's used elsewhere
  // Example:
  company: Company;
  targetColumn: string;
  request: string;
  headers: string[];
  model: string; // Or a more specific model type
};

export type DataCleaningRequestInput = CompanyDataCleaning; // Example alias
export type DataCleaningRequestOutput = { updatedValue: string | null }; // Example output type

// You might have Zod schemas here as well if you're using them for validation
// import { z } from 'zod';
// export const DataCleaningRequestInputSchema = z.object({...});
// export const DataCleaningRequestOutputSchema = z.object({...});

// You may have other data types or constants exported from this file
// export const SOME_CONSTANT = 'some_value';