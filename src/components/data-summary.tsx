'use client';

import type { Company } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

type DataSummaryProps = {
  data: Company[];
};

const revenueBuckets = {
  '< $5M': 0,
  '$5M - $10M': 0,
  '$10M - $19M': 0,
  '$20M - $49M': 0,
  '> $50M': 0,
  'Unknown': 0,
};

const revenueMapping: { [key: string]: keyof typeof revenueBuckets } = {
    '< $5M': '< $5M',
    '$5M-$9M': '$5M - $10M',
    '$10M-$19M': '$10M - $19M',
    '$20M-$49M': '$20M - $49M',
    '>$50M': '> $50M',
};

export function DataSummary({ data }: DataSummaryProps) {
  const totalCompanies = data.length;

  const ecosystemCounts = data.reduce((acc, company) => {
    const category = company.ecosystemCategory || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedEcosystems = Object.entries(ecosystemCounts).sort(([, a], [, b]) => b - a);

  const revenueCounts = data.reduce((acc, company) => {
    const revenueStr = company.revenue || '';
    const bucket = revenueMapping[revenueStr] || 'Unknown';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, { ...revenueBuckets } as Record<string, number>);


  return (
    <div className="grid gap-6 md:grid-cols-3">
       <Card>
        <CardHeader>
          <CardTitle>Total Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{totalCompanies}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>By Ecosystem</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {sortedEcosystems.map(([category, count]) => (
                <div key={category} className="flex items-center gap-2">
                    <Badge variant="secondary">{category}</Badge>
                    <span className="font-semibold">{count}</span>
                </div>
            ))}
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>By Est. Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.entries(revenueCounts).map(([bucket, count]) => (
            count > 0 && (
                <div key={bucket} className="flex items-center gap-2">
                <Badge variant="outline">{bucket}</Badge>
                <span className="font-semibold">{count}</span>
                </div>
            )
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
