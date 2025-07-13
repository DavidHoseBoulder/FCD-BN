// Temporary change to trigger redeploy
import { Company } from '@/lib/data';
import DashboardClient from '@/components/dashboard-client';
import Header from '@/components/header';
import { getCompaniesFromSheet } from '@/services/sheets';
import { HEADERS } from '@/lib/sheets-constants';
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

console.log("Loading page.tsx module."); // Log when the module is loaded

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  console.log("Executing Home page component."); // Added console log at the beginning
  let companyData: Company[] = [];
  let error: string | null = null;
  const currentView = searchParams.view || 'dashboard';

  try {
    // Temporary change for testing: returning empty array to bypass data fetching
    companyData = []; 
  } catch (e: any) {
    console.log("Caught data fetching error on frontend:", e); // Added console log for debugging
    console.error(e);
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

    if (currentView === 'datacleaning') {
      return <DataCleaningView companyData={companyData} headers={HEADERS} />;
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
