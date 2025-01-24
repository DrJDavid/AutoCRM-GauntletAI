import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/stores/userStore';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Schema for business hours
const businessHoursSchema = z.object({
  timezone: z.string(),
  regular_hours: z.object({
    monday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })),
    tuesday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })),
    wednesday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })),
    thursday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })),
    friday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })),
    saturday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })).optional(),
    sunday: z.array(z.object({
      open: z.string(),
      close: z.string(),
    })).optional(),
  }),
  holidays: z.array(z.object({
    date: z.string(),
    name: z.string(),
    closed: z.boolean(),
  })),
});

// Schema for contact information
const contactInfoSchema = z.object({
  phone_numbers: z.array(z.object({
    label: z.string(),
    number: z.string(),
    hours: z.string(),
  })),
  contact_emails: z.array(z.object({
    label: z.string(),
    email: z.string().email(),
  })),
  physical_addresses: z.array(z.object({
    label: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  })),
});

// Combined schema for the form
const formSchema = z.object({
  business_hours: businessHoursSchema,
  phone_numbers: contactInfoSchema.shape.phone_numbers,
  contact_emails: contactInfoSchema.shape.contact_emails,
  physical_addresses: contactInfoSchema.shape.physical_addresses,
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessInfoSettings() {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_hours: {
        timezone: 'America/Chicago',
        regular_hours: {
          monday: [{ open: '09:00', close: '17:00' }],
          tuesday: [{ open: '09:00', close: '17:00' }],
          wednesday: [{ open: '09:00', close: '17:00' }],
          thursday: [{ open: '09:00', close: '17:00' }],
          friday: [{ open: '09:00', close: '17:00' }],
        },
        holidays: [],
      },
      phone_numbers: [],
      contact_emails: [],
      physical_addresses: [],
    },
  });

  // Load organization settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.organization_id) return;

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('business_hours, phone_numbers, contact_emails, physical_addresses')
          .eq('id', currentUser.organization_id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            business_hours: data.business_hours || form.getValues('business_hours'),
            phone_numbers: data.phone_numbers || [],
            contact_emails: data.contact_emails || [],
            physical_addresses: data.physical_addresses || [],
          });
        }
      } catch (error) {
        console.error('Error loading organization settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load organization settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser?.organization_id, form, toast]);

  const onSubmit = async (values: FormValues) => {
    if (!currentUser?.organization_id) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('organizations')
        .update({
          business_hours: values.business_hours,
          phone_numbers: values.phone_numbers,
          contact_emails: values.contact_emails,
          physical_addresses: values.physical_addresses,
        })
        .eq('id', currentUser.organization_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving organization settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save organization settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Information</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="business_hours.timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add fields for regular hours and holidays */}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone Numbers */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Phone Numbers</h3>
                {form.watch('phone_numbers').map((_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`phone_numbers.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Support" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phone_numbers.${index}.number`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1-555-0123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`phone_numbers.${index}.hours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hours</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Mon-Fri 9-5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setValue('phone_numbers', [
                      ...form.watch('phone_numbers'),
                      { label: '', number: '', hours: '' },
                    ])
                  }
                >
                  Add Phone Number
                </Button>
              </div>

              {/* Similar sections for emails and addresses */}
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
