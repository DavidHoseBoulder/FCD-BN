'use client';

import type { Company } from '@/lib/data';
import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lightbulb } from 'lucide-react';
import { CompanyTable } from './company-table';
import { generateInsights } from '@/ai/flows/generate-insights';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

export default function DashboardClient({ data }: { data: Company[] }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateInsights = () => {
    startTransition(async () => {
      try {
        const jsonString = JSON.stringify(data);
        const result = await generateInsights({ companyData: jsonString });
        setInsights(result.insights);
      } catch (error) {
        console.error('Error generating insights:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate insights. Please try again.',
        });
        setInsights(null);
      }
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Automatic summary of your company data.
            </CardDescription>
          </div>
          <Button onClick={handleGenerateInsights} disabled={isPending} className="bg-accent hover:bg-accent/90">
            <Lightbulb className="mr-2 h-4 w-4" />
            {isPending ? 'Generating...' : 'Generate Insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : insights ? (
             <div className="space-y-2 prose prose-sm max-w-none text-foreground">
              {insights.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click the &quot;Generate Insights&quot; button to see an AI-powered analysis of the data.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Company Data</CardTitle>
          <CardDescription>A list of companies from your sheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyTable data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
