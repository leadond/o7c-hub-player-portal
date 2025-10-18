export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface FilterParams {
  [key: string]: any;
}