import { Company } from '@/lib/data';
import DashboardClient from '@/components/dashboard-client';
import Header from '@/components/header';
import { getCompaniesFromSheet } from '@/services/sheets';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default async function Home() {
  let companyData: Company[] = [];
  let error: string | null = null;

  try {
    companyData = await getCompaniesFromSheet();
  } catch (e: any) {
    console.error(e);
    error = e.message || 'An unexpected error occurred.';
     if (e.message.includes('Could not load data')) {
      error = "Could not load data from the public Google Sheet. Please ensure it's shared with 'Anyone with the link' and the link is correct.";
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Data Fetching Error</CardTitle>
              <CardDescription>
                Could not load data from the Google Sheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <DashboardClient initialData={companyData} />
        )}
      </main>
    </div>
  );
}
