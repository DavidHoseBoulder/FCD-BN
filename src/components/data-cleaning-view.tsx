'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModelSelection } from '@/hooks/use-model-selection';
import { Command, CommandEmpty, CommandGroup, CommandList, CommandItem } from './ui/command';
import { Input } from './ui/input';

const outputMappingSchema = z.object({
  dataPoint: z.string().min(1, { message: 'Data point name is required.' }),
  targetColumn: z.string().min(1, { message: 'Please select a column.' }),
});

const formSchema = z.object({
  request: z.string().min(10, { message: 'Please provide a more detailed request.' }),
  outputMappings: z.array(outputMappingSchema).min(1, { message: 'Please define at least one output mapping.' }),
});

type DataCleaningResult = {
  companyName: string;
  updatedValues: Record<string, string>;
  status: 'Processed' | 'error';
  error?: string;
};

export default function DataCleaningView({ companyData, headers }: { companyData: Company[], headers: string[] }) {
  const [isProcessing, startProcessingTransition] = useTransition();
  const [results, setResults] = useState<DataCleaningResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { selectedModel } = useModelSelection();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request: '',
      outputMappings: [{ dataPoint: '', targetColumn: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'outputMappings',
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
          const result = await processDataCleaningRequest({ ...values, company, headers, model: selectedModel });
          newResults.push({
            companyName: company['Company Name'] as string,
            updatedValues: result.updatedValues,
            status: 'Processed',
          });
        } catch (error: any) {
          let errorMessage = 'An AI processing error occurred.';
          if (error.message.includes('SA_KEY_NOT_SET')) {
            errorMessage = 'Service account not configured. Cannot write to sheet.';
          }
          newResults.push({
            companyName: company['Company Name'] as string,
            updatedValues: {},
            status: 'error',
            error: errorMessage,
          });
          console.error(`Error processing '${company['Company Name']}':`, error);

          if (error.message.includes('SA_KEY_NOT_SET')) {
             toast({
              variant: 'destructive',
              title: 'Configuration Error',
              description: 'Cannot write to sheet. Please configure your Google Service Account credentials.',
            });
            setResults([...newResults]);
            setProgress(100);
            return;
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

  const getResultHeaders = () => {
    if (results.length === 0) return [];
    const firstResult = results[0];
    return ['Company', ...Object.keys(firstResult.updatedValues), 'Status'];
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Data Cleaning & Enrichment</CardTitle>
          <CardDescription>
            Define the data you want to generate and map it to your spreadsheet columns.
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
                    <FormLabel>Your Request</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'Based on the company info, provide an estimated valuation and a rationale for it.'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Output Mapping</FormLabel>
                <p className="text-sm text-muted-foreground mb-2">
                  Define the data points for the AI to generate and map them to your sheet columns.
                </p>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`outputMappings.${index}.dataPoint`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>AI Output Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 'estimatedValuation'" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`outputMappings.${index}.targetColumn`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Sheet Column</FormLabel>
                             <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                  >
                                    {field.value ? columnOptions.find((col) => col.value === field.value)?.label : "Select a column"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                  <CommandList>
                                    <CommandEmpty>No column found.</CommandEmpty>
                                    <CommandGroup>
                                      {columnOptions.map((col) => (
                                        <CommandItem
                                          value={col.label}
                                          key={col.value}
                                          onSelect={() => {
                                            form.setValue(`outputMappings.${index}.targetColumn`, col.value)
                                          }}
                                        >
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
                       <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => append({ dataPoint: '', targetColumn: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Mapping
                </Button>
                 <FormMessage>{form.formState.errors.outputMappings?.message}</FormMessage>
              </div>

              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Start Data Enrichment'}
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
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getResultHeaders().map(header => <TableHead key={header}>{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.companyName}</TableCell>
                        {Object.keys(results[0].updatedValues).map(key => (
                           <TableCell key={key}>{result.updatedValues[key] || "N/A"}</TableCell>
                        ))}
                        <TableCell className={result.status === 'error' ? 'text-destructive' : 'text-green-500'}>
                          {result.status === 'Processed' ? 'Processed' : `Error: ${result.error}`}
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
