
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
import DataCleaningView from '@/components/data-cleaning-view';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  let headers: string[] = [];
  let companyData: Company[] | null = null;
  let error: string | null = null;
  const currentView = (await searchParams).view || 'dashboard';
  
  try {
    ({ headers, companies: companyData } = await getCompaniesFromSheet());
  } catch (e: any) {
    console.error("Data fetching error in page.tsx:", e);
    error = e.message || 'An unexpected error occurred.';
  }

  const renderContent = () => {
    if (error) {
       return (
          <Card>
            <CardHeader>
              <CardTitle>Data Fetching Error</CardTitle>
              <CardDescription>
                Could not load data from the Google Sheet. Please ensure your secrets are configured correctly and the sheet is shared with the service account email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )
    }

    if (!companyData) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (currentView === 'datacleaning') {
      return <DataCleaningView companyData={companyData} headers={headers} />;
    }
    return <DashboardClient initialData={companyData} headers={headers} />;
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
