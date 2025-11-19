/**
 * Type definitions for error handling
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
}

export interface ApiErrorResponse {
  response?: {
    status: number;
    data: {
      message?: string;
      error?: string;
    };
    headers?: Record<string, string>;
  };
  request?: unknown;
  message: string;
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'request' in error || 'message' in error)
  );
}

export function getErrorMessage(error: unknown): string {
  if (isApiErrorResponse(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || 'Erro desconhecido';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erro desconhecido';
}
