import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import path from 'node:path';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.local
config({
  path: path.resolve(process.cwd(), '.env.local'),
});

// Este script crea las tablas necesarias para Auth.js
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Creando tablas de Auth.js...');

  try {
    // Crear tabla user
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        email TEXT NOT NULL,
        "emailVerified" TIMESTAMP WITH TIME ZONE,
        image TEXT
      )
    `);
    console.log('Tabla "user" creada.');

    // Crear tabla account
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account (
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, "providerAccountId")
      )
    `);
    console.log('Tabla "account" creada.');

    // Crear tabla session
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS session (
        "sessionToken" TEXT PRIMARY KEY NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);
    console.log('Tabla "session" creada.');

    // Crear tabla verificationToken
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verificationToken" (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `);
    console.log('Tabla "verificationToken" creada.');

    console.log('Todas las tablas de Auth.js creadas correctamente');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
