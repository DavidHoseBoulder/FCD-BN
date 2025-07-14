export type Company = {
  id: number;
  [key: string]: string | number; // Allows for dynamic string keys with string or number values
};
