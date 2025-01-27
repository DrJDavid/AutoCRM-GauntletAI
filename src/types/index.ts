// Re-export all types from the database
export * from '../../supabase/types';

// Export common types used across the application
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type ErrorState = {
  message: string;
  code?: string;
  details?: unknown;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type SortDirection = 'asc' | 'desc';

export type SortParams = {
  field: string;
  direction: SortDirection;
};

// Common response type for API calls
export type ApiResponse<T> = {
  data?: T;
  error?: ErrorState;
  loading: boolean;
};

// Common form state type
export type FormState<T> = {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
};
