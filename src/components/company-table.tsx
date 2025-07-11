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
  const [sortKey, setSortKey] = useState<SortKey>('funding');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [data, sortKey, sortDirection]);

  const formatFunding = (amount: number) => `$${amount}M`;
  const formatEmployees = (count: number) => count.toLocaleString();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader sortKey="name" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('name')}>
            Company Name
          </SortableHeader>
          <SortableHeader sortKey="industry" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('industry')}>
            Industry
          </SortableHeader>
          <SortableHeader sortKey="city" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('city')}>
            City
          </SortableHeader>
          <SortableHeader sortKey="yearFounded" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('yearFounded')}>
            Founded
          </SortableHeader>
          <SortableHeader sortKey="employees" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('employees')}>
            Employees
          </SortableHeader>
          <SortableHeader sortKey="funding" currentSortKey={sortKey} sortDirection={sortDirection} onClick={() => handleSort('funding')}>
            Funding
          </SortableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((company) => (
          <TableRow key={company.id}>
            <TableCell className="font-medium">{company.name}</TableCell>
            <TableCell>{company.industry}</TableCell>
            <TableCell>{company.city}</TableCell>
            <TableCell>{company.yearFounded}</TableCell>
            <TableCell className="text-right">{formatEmployees(company.employees)}</TableCell>
            <TableCell className="text-right font-semibold text-primary">{formatFunding(company.funding)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
