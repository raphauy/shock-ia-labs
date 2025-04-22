import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    const tables = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname='public';`,
    );

    console.log('Tables in database:');
    console.log(tables);

    // Ejecutar la migración directamente
    const migrationSQL = `
    -- Create auth tables
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT NOT NULL,
      "name" TEXT,
      "email" TEXT NOT NULL,
      "emailVerified" TIMESTAMP,
      "image" TEXT,
      CONSTRAINT "user_pkey" PRIMARY KEY("id")
    );

    CREATE TABLE IF NOT EXISTS "account" (
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      CONSTRAINT "account_pkey" PRIMARY KEY("provider", "providerAccountId"),
      CONSTRAINT "account_userId_fkey" FOREIGN KEY("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "session" (
      "sessionToken" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY("sessionToken"),
      CONSTRAINT "session_userId_fkey" FOREIGN KEY("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "verificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" TIMESTAMP NOT NULL,
      CONSTRAINT "verificationToken_pkey" PRIMARY KEY("identifier", "token")
    );

    -- Create index
    CREATE INDEX IF NOT EXISTS "user_email_idx" ON "user"("email");
    `;

    console.log('Executing migration...');
    await db.execute(sql`${sql.raw(migrationSQL)}`);
    console.log('Migration executed successfully');

    const tablesAfter = await db.execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname='public';`,
    );

    console.log('Tables after migration:');
    console.log(tablesAfter);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
