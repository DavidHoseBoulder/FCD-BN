'use client';

import { useState, useMemo, type ReactNode } from 'react';
import type { Company } from '@/lib/data';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';

type SortDirection = 'asc' | 'desc';
type SortKey = keyof Company | null;

const SortableHeader = ({
  children,
  onClick,
  sortKey,
  currentSortKey,
  sortDirection,
}: {
  children: ReactNode;
  onClick: () => void;
  sortKey: SortKey;
  currentSortKey: SortKey;
  sortDirection: SortDirection;
}) => {
  const isActive = sortKey === currentSortKey;
  return (
    <TableHead>
      <Button variant="ghost" onClick={onClick} className="-ml-4 h-8">
        {children}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </TableHead>
  );
};

export function CompanyTable({ data }: { data: Company[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [data, sortKey, sortDirection]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('name')}>
            Company Name
          </SortableHeader>
          <SortableHeader sortKey="ecosystemCategory" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('ecosystemCategory')}>
            Ecosystem
          </SortableHeader>
          <SortableHeader sortKey="headquarters" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('headquarters')}>
            Headquarters
          </SortableHeader>
           <SortableHeader sortKey="employees" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('employees')}>
            Employees
          </SortableHeader>
          <SortableHeader sortKey="funding" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('funding')}>
            Funding
          </SortableHeader>
          <SortableHeader sortKey="revenue" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('revenue')}>
            Est. Revenue
          </SortableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((company) => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">
              {company.url ? (
                <Link href={company.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                  {company.name}
                </Link>
              ) : (
                company.name
              )}
              </TableCell>
            <TableCell>{company.ecosystemCategory}</TableCell>
            <TableCell>{company.headquarters}</TableCell>
            <TableCell>{company.employees}</TableCell>
            <TableCell>{company.funding}</TableCell>
            <TableCell className="font-semibold">{company.revenue}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
