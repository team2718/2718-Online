import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { DATABASE_URL } from '../config';

const client = createClient({ url: DATABASE_URL });
export const db = drizzle(client, { schema });

// Re-export schema and services for convenience
export * from './schema';
export * from '../services/index';
