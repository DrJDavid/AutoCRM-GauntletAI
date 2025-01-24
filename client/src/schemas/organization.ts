import { z } from 'zod';

/**
 * Schema for validating organization data
 */
export const organizationSchema = z.object({
  id: z.string().uuid('Invalid organization ID'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  business_hours: z
    .object({
      timezone: z.string(),
      schedule: z.array(
        z.object({
          day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
          start: z.string(),
          end: z.string(),
        })
      ),
    })
    .nullable(),
  contact_emails: z.array(z.string().email()).nullable(),
  phone_numbers: z.array(z.string()).nullable(),
  physical_addresses: z.array(
    z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      postal_code: z.string(),
    })
  ).nullable(),
  settings: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

/**
 * Schema for creating a new organization
 */
export const createOrganizationSchema = organizationSchema.omit({
  id: true,
  created_at: true,
});

/**
 * Schema for updating an organization
 */
export const updateOrganizationSchema = createOrganizationSchema.partial();

export type OrganizationInput = z.infer<typeof organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
