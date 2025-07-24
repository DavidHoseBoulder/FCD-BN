'use client';

import { useState, useTransition, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Company } from '@/lib/data';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { processDataCleaningRequest } from '@/ai/flows/process-data-cleaning-request';
import { analyzeCleaningRequest } from '@/ai/flows/analyze-cleaning-request';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModelSelection } from '@/hooks/use-model-selection';
import { Command, CommandEmpty, CommandGroup, CommandList, CommandItem } from './ui/command';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';

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

type ViewState = 'initial' | 'analyzing' | 'mapping' | 'processing' | 'results';

export default function DataCleaningView({ companyData, headers }: { companyData: Company[], headers: string[] }) {
  const [viewState, setViewState] = useState<ViewState>('initial');
  const [results, setResults] = useState<DataCleaningResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, startAnalyzingTransition] = useTransition();
  const [isProcessing, startProcessingTransition] = useTransition();

  const { toast } = useToast();
  const { selectedModel } = useModelSelection();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request: '',
      outputMappings: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'outputMappings',
  });

  const columnOptions = useMemo(() => {
    return headers.map(header => ({ value: header, label: header }));
  }, [headers]);

  const handleAnalyzePrompt = async () => {
    const request = form.getValues('request');
    if (!request || request.length < 10) {
      form.setError('request', { type: 'manual', message: 'Please provide a more detailed request before analyzing.' });
      return;
    }

    startAnalyzingTransition(async () => {
      setViewState('analyzing');
      try {
        const result = await analyzeCleaningRequest({ request, model: selectedModel });
        const newMappings = result.dataPoints.map(dp => ({ dataPoint: dp, targetColumn: '' }));
        replace(newMappings);
        setViewState('mapping');
      } catch (error) {
        console.error('Error analyzing prompt:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not determine outputs from the prompt. Please try rephrasing your request.',
        });
        setViewState('initial');
      }
    });
  };

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    setResults([]);
    setProgress(0);
    setViewState('processing');

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
            setViewState('results');
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
       setViewState('results');
    });
  };

  const getResultHeaders = () => {
    if (results.length === 0) return [];
    const firstResult = results[0];
    return ['Company', ...Object.keys(firstResult.updatedValues), 'Status'];
  };
  
  const resetForm = () => {
    form.reset({ request: '', outputMappings: [] });
    setResults([]);
    setProgress(0);
    setViewState('initial');
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>AI-Powered Data Cleaning & Enrichment</CardTitle>
              <CardDescription>
                Describe the data you want to generate, let AI identify the outputs, and map them to your sheet.
              </CardDescription>
            </div>
             {(viewState !== 'initial' && viewState !== 'analyzing') && (
                <Button onClick={resetForm} variant="outline">Start Over</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="request"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step 1: Your Request</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Based on the company info, provide an estimated valuation, a rationale for it, and a confidence score.'"
                        {...field}
                        disabled={viewState !== 'initial'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {viewState === 'initial' && (
                 <Button type="button" onClick={handleAnalyzePrompt} disabled={isAnalyzing}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Analyze Prompt to Define Outputs
                </Button>
              )}

              {viewState === 'analyzing' && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Analyzing prompt...</p>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                </div>
              )}

              { (viewState === 'mapping' || viewState === 'processing' || viewState === 'results') && fields.length > 0 && (
                <div>
                  <FormLabel>Step 2: Map AI Outputs to Sheet Columns</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    We identified these outputs from your prompt. Map them to the correct columns in your sheet.
                  </p>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/20">
                        <FormField
                          control={form.control}
                          name={`outputMappings.${index}.dataPoint`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>AI Output Name</FormLabel>
                              <FormControl>
                                <Input readOnly disabled {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Controller
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
                                                className={cn("w-full justify-between bg-background", !field.value && "text-muted-foreground")}
                                                disabled={viewState === 'processing' || viewState === 'results'}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
                
              {viewState === 'mapping' && (
                 <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Start Data Enrichment'}
                 </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {(viewState === 'processing' || (viewState === 'results' && results.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>{viewState === 'processing' ? 'Processing...' : 'Results'}</CardTitle>
            {results.length > 0 && viewState === 'results' && <CardDescription>Updates applied to your Google Sheet.</CardDescription>}
          </CardHeader>
          <CardContent>
            {viewState === 'processing' && (
              <>
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {Math.round(progress)}% complete... Processed {results.length} of {companyData.length} companies.
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
