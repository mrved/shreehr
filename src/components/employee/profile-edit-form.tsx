'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Validation schema matching UPDATABLE_FIELDS
const profileEditSchema = z.object({
  address_line1: z.string().min(1, 'Address line 1 is required').max(255),
  address_line2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  postal_code: z.string().regex(/^\d{6}$/, 'Postal code must be 6 digits'),
  emergency_contact: z.string().max(255).optional(),
  emergency_phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').optional(),
  personal_phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  personal_email: z.string().email('Invalid email format').optional(),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters)').max(500),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  defaultValues: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    emergency_contact: string | null;
    emergency_phone: string | null;
    personal_phone: string | null;
    personal_email: string | null;
  };
}

export function ProfileEditForm({ defaultValues }: ProfileEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      address_line1: defaultValues.address_line1 || '',
      address_line2: defaultValues.address_line2 || '',
      city: defaultValues.city || '',
      state: defaultValues.state || '',
      postal_code: defaultValues.postal_code || '',
      emergency_contact: defaultValues.emergency_contact || '',
      emergency_phone: defaultValues.emergency_phone || '',
      personal_phone: defaultValues.personal_phone || '',
      personal_email: defaultValues.personal_email || '',
      reason: '',
    },
  });

  // Track changed fields
  const formValues = watch();
  const checkFieldChanged = (fieldName: keyof typeof formValues) => {
    // Skip 'reason' field as it doesn't exist in defaultValues
    if (fieldName === 'reason') return false;

    const currentValue = formValues[fieldName] || '';
    const originalValue = defaultValues[fieldName] || '';
    const isChanged = currentValue !== originalValue;

    if (isChanged && !changedFields.has(fieldName)) {
      setChangedFields(new Set([...changedFields, fieldName]));
    } else if (!isChanged && changedFields.has(fieldName)) {
      const newSet = new Set(changedFields);
      newSet.delete(fieldName);
      setChangedFields(newSet);
    }

    return isChanged;
  };

  const onSubmit = async (data: ProfileEditFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/update-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit update request');
      }

      // Success - redirect to profile page
      router.push('/employee/profile');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/employee/profile');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Address Section */}
      <fieldset className="bg-white rounded-lg shadow p-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">Address</legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              {...register('address_line1')}
              type="text"
              id="address_line1"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('address_line1') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.address_line1 && (
              <p className="mt-1 text-sm text-red-600">{errors.address_line1.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
              Address Line 2
            </label>
            <input
              {...register('address_line2')}
              type="text"
              id="address_line2"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('address_line2') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.address_line2 && (
              <p className="mt-1 text-sm text-red-600">{errors.address_line2.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City <span className="text-red-500">*</span>
            </label>
            <input
              {...register('city')}
              type="text"
              id="city"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('city') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <input
              {...register('state')}
              type="text"
              id="state"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('state') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
          </div>

          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              {...register('postal_code')}
              type="text"
              id="postal_code"
              maxLength={6}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('postal_code') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.postal_code && (
              <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Contact Section */}
      <fieldset className="bg-white rounded-lg shadow p-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">Contact Information</legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="personal_phone" className="block text-sm font-medium text-gray-700">
              Personal Phone <span className="text-red-500">*</span>
            </label>
            <input
              {...register('personal_phone')}
              type="tel"
              id="personal_phone"
              maxLength={10}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('personal_phone') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.personal_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.personal_phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="personal_email" className="block text-sm font-medium text-gray-700">
              Personal Email
            </label>
            <input
              {...register('personal_email')}
              type="email"
              id="personal_email"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('personal_email') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.personal_email && (
              <p className="mt-1 text-sm text-red-600">{errors.personal_email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
              Emergency Contact Name
            </label>
            <input
              {...register('emergency_contact')}
              type="text"
              id="emergency_contact"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('emergency_contact') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.emergency_contact && (
              <p className="mt-1 text-sm text-red-600">{errors.emergency_contact.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700">
              Emergency Contact Phone
            </label>
            <input
              {...register('emergency_phone')}
              type="tel"
              id="emergency_phone"
              maxLength={10}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                checkFieldChanged('emergency_phone') ? 'bg-yellow-50 border-yellow-300' : ''
              }`}
            />
            {errors.emergency_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.emergency_phone.message}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Reason Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason for Update <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-gray-500">
          Please explain why you are requesting these changes
        </p>
        <textarea
          {...register('reason')}
          id="reason"
          rows={4}
          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="e.g., Changed residence, Updated phone number..."
        />
        {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
      </div>

      {/* Changed Fields Summary */}
      {changedFields.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">
            {changedFields.size} field(s) will be updated
          </p>
          <p className="mt-1 text-sm text-blue-700">
            Changed fields are highlighted in yellow
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
