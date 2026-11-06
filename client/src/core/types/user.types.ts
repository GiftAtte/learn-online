/** People who use the platform. */

export type Role = 'LEARNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}
