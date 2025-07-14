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
  // Find the correct header name for Revenue (assuming a standard name or similar)
 const revenueHeader = headers.find(h => h.toLowerCase().includes('revenue')) || 'Est. Annual Revenue';

  const revenueCounts = (data && Array.isArray(data)) ? data.reduce((acc, company) => {
    const revenueStr = company[revenueHeader] || '';
    const bucket = revenueMapping[revenueStr] || 'Unknown';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, { ...revenueBuckets } as Record<string, number>)
  : { ...revenueBuckets };

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