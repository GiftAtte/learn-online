import { execSync } from 'node:child_process';

/** Applies existing migrations to the test database (non-destructive; creates the DB if missing). */
export default function setup() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env } });
}
