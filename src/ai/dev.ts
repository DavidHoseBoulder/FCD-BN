import { config } from 'dotenv';
config();

import '@/ai/flows/generate-insights.ts';
import '@/ai/flows/process-data-cleaning-request.ts';
import '@/ai/flows/analyze-cleaning-request.ts';
