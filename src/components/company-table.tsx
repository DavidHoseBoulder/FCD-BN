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
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';


type Header = string;
type SortConfig = {
  key: keyof Company;
  direction: 'ascending' | 'descending';
};

export function CompanyTable({ data, headers }: { data: Company[], headers: Header[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Basic numeric comparison if possible
        const numA = parseFloat(String(aValue).replace(/[^0-9.-]+/g, ""));
        const numB = parseFloat(String(bValue).replace(/[^0-9.-]+/g, ""));

        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA < numB) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (numA > numB) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        }

        // Fallback to string comparison
        if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key: keyof Company) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (header: Header) => {
    if (!sortConfig || sortConfig.key !== header) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>
               <Button variant="ghost" onClick={() => requestSort(header)} className="p-0 hover:bg-transparent">
                {header}
                {getSortIcon(header)}
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((company, index) => (
          <TableRow key={company.id || index}>
            {headers.map((header, cellIndex) => (
              <TableCell key={cellIndex}>{company[header] as ReactNode}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
