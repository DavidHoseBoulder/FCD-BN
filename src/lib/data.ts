export type Company = {
  id: number;
  name: string;
  url: string;
  targeting: string;
  ecosystemCategory: string;
  category: string;
  ceo: string; // Represents "Management Team (CEO/Key Execs)"
  headquarters: string;
  funding: string; // Represents "Funding/Investors"
  customers: string; // Represents "Key Customers / Segment"
  offering: string; // Represents "Core Offering / Competitive Strengths"
  areasAddressed: string;
  revenue: string; // Represents "Est. Annual Revenue"
  employees: string; // Represents "# Employees"
  notes: string; // Represents "Notes & Source (for Rev & Emp)"
  pitchbookInfo: string;
  stillExists: string;
};
