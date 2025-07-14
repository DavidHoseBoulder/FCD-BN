'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Company } from '@/lib/data';
import { useTransition } from 'react';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Company name must be at least 2 characters.' }),
  url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  ecosystemCategory: z.string().min(2, { message: 'Ecosystem category is required.' }),
  headquarters: z.string().min(2, { message: 'Headquarters is required.' }),
  offering: z.string().optional(),
  employees: z.string().optional(),
  revenue: z.string().optional(),
  funding: z.string().optional(),
});

type AddCompanyFormProps = {
  onSubmit: (data: Omit<Company, 'id'>) => Promise<void>;
};

export function AddCompanyForm({ onSubmit }: AddCompanyFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
      ecosystemCategory: '',
      headquarters: '',
      offering: '',
      employees: '',
      revenue: '',
      funding: '',
    },
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
        const fullCompanyData: Omit<Company, 'id'> = {
          ...values,
          // Fill in the rest of the fields with empty strings to match the Company type
          targeting: '',
          category: '',
          ceo: '',
          customers: '',
          areasAddressed: '',
          notes: '',
          pitchbookInfo: '',
          stillExists: '',
          url: values.url || '',
          offering: values.offering || '',
          employees: values.employees || '',
          revenue: values.revenue || '',
          funding: values.funding || '',
        };
      await onSubmit(fullCompanyData);
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Innovate Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://innovate.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ecosystemCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ecosystem Category</FormLabel>
                <FormControl>
                  <Input placeholder="Core Connectivity & Infrastructure" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="headquarters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Headquarters</FormLabel>
                <FormControl>
                  <Input placeholder="San Francisco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="employees"
            render={({ field }) => (
              <FormItem>
                <FormLabel># Employees</FormLabel>
                <FormControl>
                  <Input placeholder="50-100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="funding"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funding/Investors</FormLabel>
                <FormControl>
                  <Input placeholder="Bootstrapped" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Annual Revenue</FormLabel>
                <FormControl>
                  <Input placeholder="$10M-$19M" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="offering"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Core Offering</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the company's core offering..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Company'}
        </Button>
      </form>
    </Form>
  );
}
