/**
 * @fileOverview Defines constants related to the Google Sheet integration.
 * This file separates constants from server-side logic to comply with
 * Next.js "use server" constraints.
 */

// This header list MUST match the columns in your Google Sheet exactly.
// This is used to map column names to their index when updating a cell.
export const HEADERS = [
  "Company Name",
  "URL",
  "Targeting",
  "Ecosystem Category",
  "Category",
  "Management Team (CEO/Key Execs)",
  "Headquarters",
  "Funding/Investors",
  "Key Customers / Segment",
  "Core Offering / Competitive Strengths",
  "Areas Addressed",
  "Est. Annual Revenue",
  "# Employees",
  "Notes & Source (for Rev & Emp)",
  "PitchBook Info",
  "Still Exists?"
];
