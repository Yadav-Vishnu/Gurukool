import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Standardized API Response Helpers
 *
 * Every API endpoint returns responses in the same format:
 * { success: true/false, message: "...", data: {...} }
 *
 * This makes it easy for the frontend to handle responses consistently.
 */

/**
 * Send a success response (HTTP 200).
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a "created" response (HTTP 201).
 */
export const sendCreated = <T>(
  res: Response,
  message: string,
  data?: T
): Response => {
  return sendSuccess(res, message, data, 201);
};

/**
 * Send an error response.
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send a 401 Unauthorized response.
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Authentication required'
): Response => {
  return sendError(res, message, 401);
};

/**
 * Send a 403 Forbidden response.
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Access denied'
): Response => {
  return sendError(res, message, 403);
};

/**
 * Send a 404 Not Found response.
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

/**
 * Send a 429 Too Many Requests response.
 */
export const sendTooManyRequests = (
  res: Response,
  message: string = 'Too many requests. Please try again later.'
): Response => {
  return sendError(res, message, 429);
};
