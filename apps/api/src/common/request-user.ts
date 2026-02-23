import type { Request } from 'express';

export const getUserIdFromHeader = (
  value: string | string[] | undefined,
): string => {
  const headerValue = Array.isArray(value) ? value[0] : value;
  if (typeof headerValue === 'string') {
    const trimmed = headerValue.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return 'default';
};

export const getUserIdFromRequest = (req: Request): string =>
  getUserIdFromHeader(req.headers['x-user-id']);
