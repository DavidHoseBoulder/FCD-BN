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
} from '@/components/ui/table'; // Assuming ui/table is local


type Header = string;

export function CompanyTable({ data, headers }: { data: Company[], headers: Header[] }) {


  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((company, index) => (
          <TableRow key={index}>{/* Using index as a temporary key */}
            {headers.map((header, cellIndex) => (
              <TableCell key={cellIndex}>{company[header] as ReactNode} {/* Dynamically access value by header name */}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
