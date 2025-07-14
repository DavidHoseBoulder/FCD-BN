'use client';

import type { Company } from '@/lib/data';
import { useState, useTransition, startTransition, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, PlusCircle } from 'lucide-react';
import { CompanyTable } from './company-table';
import { generateInsights } from '@/ai/flows/generate-insights';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { AddCompanyForm } from './add-company-form';
import { addCompanyToSheet } from '@/services/sheets';
import { DataSummary } from './data-summary';

export default function DashboardClient({ initialData }: { initialData: Company[] }) {
  const [data, setData] = useState<Company[]>(initialData);
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, startInsightsTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEcosystem, setSelectedEcosystem] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEcosystemSelect = (category: string) => {
    setSelectedEcosystem((prev) => (prev === category ? null : category));
  };

  const filteredData = useMemo(() => {
    if (!selectedEcosystem) {
      return data;
    }
    return data.filter((company) => company.ecosystemCategory === selectedEcosystem);
  }, [data, selectedEcosystem]);

  const handleGenerateInsights = () => {
    startInsightsTransition(async () => {
      try {
        const jsonString = JSON.stringify(filteredData);
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

  const handleAddCompany = async (newCompanyData: Omit<Company, 'id'>) => {
    try {
      const addedCompany = await addCompanyToSheet(newCompanyData);
      startTransition(() => {
        setData((prevData) => [...prevData, addedCompany]);
      });
      setShowAddForm(false);
      toast({
        title: 'Success',
        description: 'Company added to your sheet.',
      });
    } catch (error: any) {
      console.error('Error adding company:', error);
      let description = 'Failed to add company. Please try again.';
      if (error.message.includes('SA_KEY_NOT_SET')) {
        description = 'Cannot add company. Service account credentials are not configured.';
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description,
      });
    }
  };


  return (
    <div className="grid gap-6">
      <DataSummary
        data={data} 
        onEcosystemSelect={handleEcosystemSelect}
        selectedEcosystem={selectedEcosystem}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Automatic summary of your company data. {selectedEcosystem && `(Filtered by ${selectedEcosystem})`}
            </CardDescription>
          </div>
          <Button onClick={handleGenerateInsights} disabled={isGeneratingInsights} className="bg-accent hover:bg-accent/90">
            <Lightbulb className="mr-2 h-4 w-4" />
            {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {isGeneratingInsights ? (
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Company Data</CardTitle>
            <CardDescription>
              {selectedEcosystem 
                ? `${filteredData.length} companies in ${selectedEcosystem}`
                : `A list of all ${data.length} companies from your sheet.`}
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            {showAddForm ? 'Cancel' : 'Add Company'}
          </Button>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg">
                <AddCompanyForm onSubmit={handleAddCompany} />
            </div>
           )}
          <CompanyTable key={`${selectedEcosystem}-${filteredData.length}`} data={filteredData} />
        </CardContent>
      </Card>
    </div>
  );
}
