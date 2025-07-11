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

const formSchema = z.object({
  name: z.string().min(2, { message: 'Company name must be at least 2 characters.' }),
  industry: z.string().min(2, { message: 'Industry must be at least 2 characters.' }),
  city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  yearFounded: z.coerce.number().int().min(1800).max(new Date().getFullYear()),
  employees: z.coerce.number().int().min(1),
  funding: z.coerce.number().min(0),
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
      industry: '',
      city: '',
      yearFounded: new Date().getFullYear(),
      employees: 10,
      funding: 1,
    },
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      await onSubmit(values);
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
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Tech" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearFounded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Founded</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                  <FormLabel>Employees</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                  <FormLabel>Funding (in millions)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding...' : 'Add Company'}
        </Button>
      </form>
    </Form>
  );
}
