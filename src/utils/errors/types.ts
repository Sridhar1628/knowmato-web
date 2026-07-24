export interface AppError {
  success: false;

  status: number;

  title: string;

  message: string;

  code?: string;

  errors?: Record<string, string[]>;

  original?: unknown;
}