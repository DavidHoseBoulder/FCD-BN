import { Company } from '@/lib/data';
import DashboardClient from '@/components/dashboard-client';
import Header from '@/components/header';
import { getCompaniesFromSheet } from '@/services/sheets';

export default async function Home() {
  const companyData: Company[] = await getCompaniesFromSheet();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardClient data={companyData} />
      </main>
    </div>
  );
}
