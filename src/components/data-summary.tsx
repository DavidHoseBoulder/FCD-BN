'use client';

import type { Company } from '@/lib/data'; // Ensure Company type is imported
import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig
} from '@/components/ui/chart';
import { Pie, PieChart, Sector, Cell } from 'recharts';
import { cn } from '@/lib/utils';

type DataSummaryProps = {
  data: Company[];
  selectedEcosystem: string | null;
  onEcosystemSelect: (category: string) => void;
  headers: string[]; // Add headers prop
};

const rankBuckets = {
    'Excellent': 0,
    'Good': 0,
    'Moderate': 0,
    'Low': 0,
    'Poor': 0,
    'Unknown': 0,
};

const revenueBuckets = {
  '< $5M': 0,
  '$5M - $10M': 0,
  '$10M - $19M': 0,
  '$20M - $49M': 0,
  '> $50M': 0,
  'Unknown': 0,
};

const employeeBuckets = {
  '<20': 0,
  '20-50': 0,
  '50-100': 0,
  '>100': 0,
  'Unknown': 0,
};

const getRankBucket = (rank: string | number | undefined): keyof typeof rankBuckets => {
    if (rank === undefined || rank === null || rank === '') {
        return 'Unknown';
    }
    const rankValue = typeof rank === 'string' ? parseInt(rank, 10) : rank;
    if (isNaN(rankValue)) return 'Unknown';

    switch (rankValue) {
        case 5: return 'Excellent';
        case 4: return 'Good';
        case 3: return 'Moderate';
        case 2: return 'Low';
        case 1: return 'Poor';
        default: return 'Unknown';
    }
};

// This function now takes a string or number and returns the correct bucket
const getRevenueBucket = (revenue: string | number | undefined): keyof typeof revenueBuckets => {
    if (revenue === undefined || revenue === null || revenue === '') {
        return 'Unknown';
    }

    // Handle numeric values directly
    if (typeof revenue === 'number') {
        if (revenue < 5000000) return '< $5M';
        if (revenue < 10000000) return '$5M - $10M';
        if (revenue < 20000000) return '$10M - $19M';
        if (revenue < 50000000) return '$20M - $49M';
        return '> $50M';
    }

    // Handle string values (like '$5M-$9M', '< $5M')
    const revenueStr = String(revenue);
     if (revenueStr.includes('< $5M')) return '< $5M';
    if (revenueStr.includes('$5M-$9M')) return '$5M - $10M';
    if (revenueStr.includes('$10M-$19M')) return '$10M - $19M';
    if (revenueStr.includes('$20M-$49M')) return '$20M - $49M';
    if (revenueStr.includes('>$50M')) return '> $50M';

    // Handle plain numbers as strings
    const numericValue = parseFloat(revenueStr.replace(/[^0-9.-]+/g,""));
    if (!isNaN(numericValue)) {
         if (numericValue < 5000000) return '< $5M';
        if (numericValue < 10000000) return '$5M - $10M';
        if (numericValue < 20000000) return '$10M - $19M';
        if (numericValue < 50000000) return '$20M - $49M';
        return '> $50M';
    }


    return 'Unknown';
}


const getEmployeeBucket = (employees: string | number | undefined): keyof typeof employeeBuckets => {
    if (employees === undefined || employees === null || employees === '') {
        return 'Unknown';
    }
    const numEmployees = typeof employees === 'string' ? parseInt(employees.replace(/,/g, ''), 10) : employees;

    if (isNaN(numEmployees)) return 'Unknown';
    if (numEmployees < 20) return '<20';
    if (numEmployees <= 50) return '20-50';
    if (numEmployees <= 100) return '50-100';
    return '>100';
};


const ActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-8} textAnchor="middle" fill={fill} className="text-sm font-bold">
        {payload.name}
      </text>
       <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xs">
        ({payload.value})
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={fill}
        strokeWidth={2}
      />
    </g>
  );
};
export function DataSummary({ data, selectedEcosystem, onEcosystemSelect, headers }: DataSummaryProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  // Find the correct header name for Ecosystem Category (assuming a standard name or similar)
  const ecosystemHeader = headers.find(h => h.toLowerCase().includes('ecosystem')) || 'Ecosystem Category';

  const ecosystemCounts = (data && Array.isArray(data)) ? data.reduce((acc, company) => {
    const category = company[ecosystemHeader] || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  const sortedEcosystems = Object.entries(ecosystemCounts).sort(([, a], [, b]) => b - a);

  const chartData = useMemo(() => sortedEcosystems.map(([name, value]) => ({
    name,
    value,
  })), [sortedEcosystems]);

  const chartConfig = useMemo(() => chartData.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig), [chartData]);
  
  const rankHeader = headers.find(h => h.toLowerCase() === 'rank');
  const rankCounts = useMemo(() => {
    const counts = { ...rankBuckets };
    if (!rankHeader || !data) return counts;

    data.forEach(company => {
        const rankValue = company[rankHeader];
        const bucket = getRankBucket(rankValue);
        counts[bucket]++;
    });
    
    return counts;
  }, [data, rankHeader]);

  // Use the specific "Annual Revenue - High" column, falling back to a search if not found
  const revenueHeader = headers.find(h => h === 'Annual Revenue - High') || headers.find(h => h.toLowerCase().includes('revenue'));

  const revenueCounts = useMemo(() => {
    const counts = { ...revenueBuckets };
    if (!revenueHeader || !data) return counts;

    data.forEach(company => {
        const revenueValue = company[revenueHeader];
        const bucket = getRevenueBucket(revenueValue);
        counts[bucket]++;
    });

    return counts;
  }, [data, revenueHeader]);

   const employeeHeader = headers.find(h => h === '# Employees - High') || headers.find(h => h.toLowerCase().includes('employees'));

    const employeeCounts = useMemo(() => {
        const counts = { ...employeeBuckets };
        if (!employeeHeader || !data) return counts;

        data.forEach(company => {
            const employeeValue = company[employeeHeader];
            const bucket = getEmployeeBucket(employeeValue);
            counts[bucket]++;
        });

        return counts;
    }, [data, employeeHeader]);


  const handlePieClick = useCallback((_: any, index: number) => {
      const category = chartData[index].name;
      onEcosystemSelect(category);
      setActiveIndex(activeIndex === index ? undefined : index);
    },
    [onEcosystemSelect, chartData, activeIndex]
  );

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(undefined);
  }, []);

  const totalCompanies = data?.length ?? 0;
  return (
    <div className="grid gap-6 md:grid-cols-5">
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
        <CardContent className="flex justify-center">
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-[250px]"
            >
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        activeIndex={activeIndex}
                        activeShape={ActiveShape}
                        onClick={handlePieClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                    </Pie>
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>By Rank</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
            {Object.entries(rankCounts).map(([bucket, count]) => (
                count > 0 && (
                    <div key={bucket} className="flex items-center gap-4">
                      <Badge variant="outline">{bucket}</Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                )
            ))}
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>By Est. Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          {Object.entries(revenueCounts).map(([bucket, count]) => (
            count > 0 && (
                <div key={bucket} className="flex items-center gap-4">
                  <Badge variant="outline">{bucket}</Badge>
                  <span className="font-semibold">{count}</span>
                </div>
            )
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>By Est. Employees</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-2">
          {Object.entries(employeeCounts).map(([bucket, count]) => (
            count > 0 && (
                <div key={bucket} className="flex items-center gap-4">
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
