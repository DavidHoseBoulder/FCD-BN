export type Company = {
  id: number;
  'Company Name': string;
  'Ecosystem Category'?: string;
  'LinkedIn URL'?: string; // Added LinkedIn URL
  [key: string]: string | number | undefined; // Allows for other dynamic string keys
};
