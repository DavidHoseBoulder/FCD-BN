export type Company = {
  id: number;
  name: string;
  industry: string;
  city: string;
  yearFounded: number;
  employees: number;
  funding: number; // in millions
};

export const companies: Company[] = [
  { id: 1, name: "Innovate Inc.", industry: "Tech", city: "San Francisco", yearFounded: 2015, employees: 250, funding: 120 },
  { id: 2, name: "HealthWell", industry: "Healthcare", city: "New York", yearFounded: 2018, employees: 500, funding: 75 },
  { id: 3, name: "EcoSolutions", industry: "Renewable Energy", city: "Austin", yearFounded: 2020, employees: 80, funding: 30 },
  { id: 4, name: "DataDrive", industry: "Tech", city: "Seattle", yearFounded: 2016, employees: 300, funding: 200 },
  { id: 5, name: "FinLeap", industry: "FinTech", city: "London", yearFounded: 2019, employees: 150, funding: 90 },
  { id: 6, name: "BioGenix", industry: "Biotech", city: "Boston", yearFounded: 2017, employees: 400, funding: 150 },
  { id: 7, name: "Quantum Computing Co", industry: "Tech", city: "Palo Alto", yearFounded: 2021, employees: 50, funding: 500 },
  { id: 8, name: "GreenEats", industry: "Food & Beverage", city: "Los Angeles", yearFounded: 2019, employees: 120, funding: 25 },
  { id: 9, name: "NextGen Med", industry: "Healthcare", city: "Chicago", yearFounded: 2020, employees: 200, funding: 60 },
  { id: 10, name: "SolarWinds Energy", industry: "Renewable Energy", city: "Denver", yearFounded: 2018, employees: 180, funding: 85 },
];
