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

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  let companyData: Company[] = [];
  let error: string | null = null;
  const currentView = searchParams.view || 'dashboard';

  try {
    companyData = await getCompaniesFromSheet();
  } catch (e: any) {
    console.error(e);
    error = e.message || 'An unexpected error occurred.';
     if (e.message.includes('Could not load data')) {
      error = "Could not load data from the public Google Sheet. Please ensure it's shared with 'Anyone with the link' and the link is correct.";
    } else if (e.message.includes('SA_KEY_NOT_SET')) {
        console.warn("Service account not configured. 'Add Company' will not work.");
    }
  }

  const renderContent = () => {
    if (error && !error.includes('SA_KEY_NOT_SET')) {
       return (
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
        )
    }

    if (currentView === 'datacleaning') {
      return <DataCleaningView companyData={companyData} />;
    }
    return <DashboardClient initialData={companyData} />;
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
