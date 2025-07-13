'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Company } from '@/lib/data';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { processDataCleaningRequest } from '@/ai/flows/process-data-cleaning-request';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Combobox } from './ui/combobox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  request: z.string().min(10, { message: 'Please provide a more detailed request.' }),
  targetColumn: z.string({ required_error: 'Please select a column to update.' }).min(1, { message: 'Please select a column to update.' }),
});

type DataCleaningResult = {
  companyName: string;
  updatedValue: string;
  status: 'success' | 'error';
  error?: string;
};

export default function DataCleaningView({ companyData, headers }: { companyData: Company[], headers: string[] }) {
  const [isProcessing, startProcessingTransition] = useTransition();
  const [results, setResults] = useState<DataCleaningResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { request: '' },
  });

  const columnOptions = useMemo(() => {
    return headers.map(header => ({ value: header, label: header }));
  }, [headers]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    setResults([]);
    setProgress(0);

    startProcessingTransition(async () => {
      let processedCount = 0;
      const newResults: DataCleaningResult[] = [];

      for (const company of companyData) {
        try {
          const result = await processDataCleaningRequest({ ...values, company });
          newResults.push({
            companyName: company.name,
            updatedValue: result.updatedValue,
            status: 'success',
          });
        } catch (error: any) {
          console.error(`Error processing ${company.name}:`, error);
          let errorMessage = 'An AI processing error occurred.';
           if (error.message.includes('SA_KEY_NOT_SET')) {
            errorMessage = 'Service account not configured. Cannot write to sheet.';
          }
          newResults.push({
            companyName: company.name,
            updatedValue: '',
            status: 'error',
            error: errorMessage,
          });

          // Stop processing if the service account is not set
          if (error.message.includes('SA_KEY_NOT_SET')) {
             toast({
              variant: 'destructive',
              title: 'Configuration Error',
              description: 'Cannot write to sheet. Please configure your Google Service Account credentials.',
            });
            setResults([...newResults]);
            setProgress(100); // Show completion even though we stopped early
            return; // Stop the loop
          }
        }
        processedCount++;
        setProgress((processedCount / companyData.length) * 100);
        setResults([...newResults]);
      }
      
       toast({
        title: 'Processing Complete',
        description: `Finished processing all ${companyData.length} companies.`,
      });
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Data Cleaning</CardTitle>
          <CardDescription>
            Enter a request to process and update your spreadsheet data row by row.
            This requires write access to the Google Sheet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="request"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleaning Request</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'Find the LinkedIn URL for each company'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetColumn"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Column to Update</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? columnOptions.find(
                                  (col) => col.value === field.value
                                )?.label
                              : "Select a column"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search columns..." />
                          <CommandList>
                            <CommandEmpty>No column found.</CommandEmpty>
                            <CommandGroup>
                              {columnOptions.map((col) => (
                                <CommandItem
                                  value={col.label}
                                  key={col.value}
                                  onSelect={() => {
                                    form.setValue("targetColumn", col.value)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      col.value === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {col.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Start Data Cleaning'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isProcessing || results.length > 0) && (
         <Card>
            <CardHeader>
                <CardTitle>{isProcessing ? 'Processing...' : 'Results'}</CardTitle>
                 {results.length > 0 && !isProcessing && <CardDescription>Updates applied to your Google Sheet.</CardDescription>}
            </CardHeader>
            <CardContent>
                 {isProcessing && (
                    <>
                        <Progress value={progress} className="w-full" />
                        <p className="text-center text-sm text-muted-foreground mt-2">
                            {Math.round(progress)}% complete
                        </p>
                    </>
                 )}
                 {results.length > 0 && (
                    <div className="mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>New Value</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((result, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{result.companyName}</TableCell>
                                        <TableCell>{result.updatedValue}</TableCell>
                                        <TableCell className={result.status === 'error' ? 'text-destructive' : 'text-green-500'}>
                                            {result.status === 'success' ? 'Success' : `Error: ${result.error}`}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                 )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
