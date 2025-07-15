
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

// This tells Next.js not to cache the data from this page.
// It will re-fetch from the Google Sheet on every request.
export const revalidate = 0;

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  let headers: string[] = [];
  let companyData: Company[] | null = null;
  let error: string | null = null;
  const currentView = searchParams?.view || 'dashboard';
  
  try {
    ({ headers, companies: companyData } = await getCompaniesFromSheet());
  } catch (e: any) {
    console.error("Data fetching error in page.tsx:", e);
    error = e.message || 'An unexpected error occurred.';
    // A bit of a hack to extract the core message from my custom error formats
    if (error.includes("CREDENTIALS_JSON_NOT_SET:")) {
        error = "The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set for local development. Please create a .env.local file with the service account JSON.";
    } else if (error.includes("Could not load data from Google Sheet:")) {
        error = error.split("Could not load data from Google Sheet:")[1].trim();
    }
  }

  const renderContent = () => {
    if (error) {
       return (
          <Card>
            <CardHeader>
              <CardTitle>Data Fetching Error</CardTitle>
              <CardDescription>
                Could not load data from the Google Sheet. Please check your configuration and that the sheet is shared with the service account email.
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

    // This handles the initial loading state before data or error is available
    if (!companyData) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }
    
    // This handles the case where data fetch is successful but sheet is empty
    if (companyData.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Sheet is Empty</CardTitle>
                    <CardDescription>
                        We connected to your Google Sheet, but it appears to be empty or only contains a header row.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Please add some data to the sheet named "{process.env.SHEET_NAME || 'Company List'}" to get started.</p>
                </CardContent>
            </Card>
        )
    }

    if (currentView === 'datacleaning') {
      // By adding a key that's derived from the headers, we force React
      // to re-mount the component if the headers change, ensuring it
      // gets the latest props.
      return <DataCleaningView key={headers.join('-')} companyData={companyData} headers={headers} />;
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
