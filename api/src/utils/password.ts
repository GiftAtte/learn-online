import bcrypt from 'bcryptjs';

// bcrypt cost factor: each +1 doubles hashing time. 10 is a common balance of security vs. latency.
// Note bcrypt ignores input beyond 72 bytes, which is why the register schema caps passwords at 72.
const ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
