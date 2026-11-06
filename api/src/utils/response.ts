import type { Response } from 'express';
import type { ErrorCode } from './AppError';

/**
 * The single response contract used by every endpoint:
 *   success: { success: true,  data, meta? }
 *   failure: { success: false, error: { code, message, details? } }
 */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

export interface ApiFailure {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown };
}

export const ok = <T>(res: Response, data: T, meta?: PageMeta) =>
  res.status(200).json({ success: true, data, ...(meta && { meta }) } satisfies ApiSuccess<T>);

export const created = <T>(res: Response, data: T) =>
  res.status(201).json({ success: true, data } satisfies ApiSuccess<T>);

export const noContent = (res: Response) => res.status(204).end();

export const errorBody = (code: ErrorCode, message: string, details?: unknown): ApiFailure => ({
  success: false,
  error: { code, message, ...(details !== undefined && { details }) },
});
