import { Response } from 'express';

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message: message || 'تمت العملية بنجاح',
    data,
  });
}

export function paginatedResponse<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return res.status(200).json({
    success: true,
    message: message || 'تم جلب البيانات بنجاح',
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
