import { z } from 'zod';

/** Reusable `?sortDir=asc|desc` for list endpoints. Each endpoint defines which `sortBy` fields it allows. */
export const sortDirSchema = z.enum(['asc', 'desc']).default('desc');
