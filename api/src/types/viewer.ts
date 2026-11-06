import type { Role } from '@prisma/client';

/** The identity attached to a request after authentication. */
export interface Viewer {
  id: string;
  role: Role;
}
