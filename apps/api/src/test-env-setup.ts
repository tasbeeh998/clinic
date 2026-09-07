import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

// Verify test database URL is loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in test environment');
}

// Verify we're using the test database
if (!process.env.DATABASE_URL.includes('clinic_test_db')) {
  throw new Error('DATABASE_URL does not point to clinic_test_db. Test safety violation!');
}

// Verify JWT secrets are set for tests
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in test environment');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is not set in test environment');
}
