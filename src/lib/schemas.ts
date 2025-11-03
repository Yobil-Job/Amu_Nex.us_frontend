import { z } from 'zod';

// Event schemas
export const eventSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  clubId: z.string().min(1, 'Please select a club'),
  startAt: z.string().min(1, 'Start date/time is required'),
  endAt: z.string().min(1, 'End date/time is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).refine((data) => {
  if (data.startAt && data.endAt) {
    return new Date(data.endAt) > new Date(data.startAt);
  }
  return true;
}, {
  message: 'End date/time must be after start date/time',
  path: ['endAt'],
});

// Fee schemas
export const feeSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, { message: 'Amount must be a positive number' }),
  purpose: z.string()
    .min(3, 'Purpose must be at least 3 characters')
    .max(200, 'Purpose must not exceed 200 characters'),
  clubId: z.string().min(1, 'Please select a club'),
  studentId: z.string().min(1, 'Please select a student'),
});

// Announcement schemas
export const announcementSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must not exceed 50 characters'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  clubId: z.string().min(1, 'Please select a club'),
});

// Authority schemas
export const authoritySchema = z.object({
  name: z.string()
    .min(3, 'Role name must be at least 3 characters')
    .max(50, 'Role name must not exceed 50 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  clubId: z.string().min(1, 'Please select a club'),
  studentId: z.string().min(1, 'Please select a student'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstname: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
  lastname: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_MENTION'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }).optional(),
  yearOfStay: z.enum(['First_Year', 'Second_Year', 'Third_Year', 'Fourth_Year', 'Fivth_Year', 'Sixth_Year'], {
    errorMap: () => ({ message: 'Please select a valid year' }),
  }).optional(),
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department must not exceed 100 characters')
    .optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

// Club schemas
export const clubSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  club_Type: z.string().min(1, 'Please select a club type'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  logo: z.string().url('Invalid URL').optional().or(z.literal('')),
});

// Student schemas (for edit)
export const studentUpdateSchema = z.object({
  firstname: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastname: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_MENTION'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  yearOfStay: z.enum(['First_Year', 'Second_Year', 'Third_Year', 'Fourth_Year', 'Fivth_Year', 'Sixth_Year'], {
    errorMap: () => ({ message: 'Please select a valid year' }),
  }),
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department must not exceed 100 characters'),
});

// Type exports for TypeScript
export type EventFormData = z.infer<typeof eventSchema>;
export type FeeFormData = z.infer<typeof feeSchema>;
export type AnnouncementFormData = z.infer<typeof announcementSchema>;
export type AuthorityFormData = z.infer<typeof authoritySchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ClubFormData = z.infer<typeof clubSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>;
