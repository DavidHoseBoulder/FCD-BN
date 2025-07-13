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

type DebugInfo = {
  secretExists: boolean;
  secretLength: number;
  parsedProjectId?: string;
  parsedClientEmail?: string;
  parseError?: string;
}

export default async function Home({ searchParams }: { searchParams: { view?: string } }) {
  let companyData: Company[] = [];
  let error: string | null = null;
  const currentView = searchParams.view || 'dashboard';
  let debugInfo: DebugInfo = {
    secretExists: false,
    secretLength: 0,
  };

  // --- Start Debugging Logic ---
  const credentialsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  debugInfo.secretExists = !!credentialsJsonString;
  debugInfo.secretLength = credentialsJsonString?.length || 0;

  if (credentialsJsonString) {
    try {
      const credentials = JSON.parse(credentialsJsonString);
      debugInfo.parsedProjectId = credentials.project_id;
      debugInfo.parsedClientEmail = credentials.client_email;
    } catch (e: any) {
      debugInfo.parseError = `Failed to parse credentials JSON: ${e.message}`;
    }
  }
  // --- End Debugging Logic ---

  try {
    companyData = await getCompaniesFromSheet();
  } catch (e: any) {
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
                Could not load data from the Google Sheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Card className="mt-4 bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Secrets Debugging Info</CardTitle>
                  <CardDescription>This information helps diagnose connection issues.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>`GOOGLE_APPLICATION_CREDENTIALS_JSON` exists:</strong> {debugInfo.secretExists ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Secret Length:</strong> {debugInfo.secretLength} characters</p>
                  {debugInfo.parseError ? (
                    <p className="text-destructive"><strong>JSON Parse Error:</strong> {debugInfo.parseError}</p>
                  ) : (
                    <>
                      <p><strong>Parsed Project ID:</strong> {debugInfo.parsedProjectId || 'Not found'}</p>
                      <p><strong>Parsed Client Email:</strong> {debugInfo.parsedClientEmail || 'Not found'}</p>
                    </>
                  )}
                </CardContent>
              </Card>
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
