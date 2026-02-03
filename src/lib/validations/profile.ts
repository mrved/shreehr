import { z } from 'zod';

// Fields that employees can update via the profile update request workflow
export const UPDATABLE_FIELDS = [
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'emergency_contact',
  'emergency_phone',
  'personal_phone',
  'personal_email',
] as const;

export type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

// Validation schema for profile update request
export const profileUpdateSchema = z
  .object({
    address_line1: z.string().min(1).max(255).optional(),
    address_line2: z.string().max(255).optional().nullable(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    postal_code: z
      .string()
      .regex(/^\d{6}$/, 'Postal code must be 6 digits')
      .optional(),
    emergency_contact: z.string().min(1).max(255).optional().nullable(),
    emergency_phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be 10 digits')
      .optional()
      .nullable(),
    personal_phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be 10 digits')
      .optional(),
    personal_email: z.string().email('Invalid email format').optional().nullable(),
    reason: z.string().min(1).max(500).optional(), // Employee's reason for update
  })
  .refine(
    (data) => {
      // At least one updatable field must be provided
      const hasUpdate = UPDATABLE_FIELDS.some(
        (field) => data[field as keyof typeof data] !== undefined
      );
      return hasUpdate;
    },
    {
      message: 'At least one field must be updated',
    }
  );

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Schema for approve/reject actions
export const profileUpdateActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(1).max(500).optional(),
}).refine(
  (data) => {
    if (data.action === 'reject' && !data.rejection_reason) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when rejecting',
    path: ['rejection_reason'],
  }
);

export type ProfileUpdateAction = z.infer<typeof profileUpdateActionSchema>;
