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

// Este script unifica las tablas de usuarios User y user
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Unificando tablas de usuarios...');

  try {
    // 1. Verificar si existen ambas tablas
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('User', 'user')
    `);

    console.log('Tablas encontradas:', tables);

    const hasUpperCaseTable = tables.some((t: any) => t.tablename === 'User');
    const hasLowerCaseTable = tables.some((t: any) => t.tablename === 'user');

    if (!hasUpperCaseTable) {
      console.log('No existe la tabla User, no es necesario migrar');
      return;
    }

    if (!hasLowerCaseTable) {
      console.log('No existe la tabla user, creando...');
      await db.execute(sql`
        CREATE TABLE "user" (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT,
          email TEXT NOT NULL,
          "emailVerified" TIMESTAMP WITH TIME ZONE,
          image TEXT
        )
      `);
      console.log('Tabla user creada');
    }

    // 2. Obtener usuarios de la tabla User
    const oldUsers = await db.execute(sql`SELECT * FROM "User"`);
    console.log(`Encontrados ${oldUsers.length} usuarios en la tabla User`);

    // 3. Migrar cada usuario a la nueva tabla
    for (const oldUser of oldUsers) {
      const userId = (oldUser as any).id;
      const email = (oldUser as any).email;

      // Verificar si ya existe un usuario con este email en la tabla nueva
      const existingUsers = await db.execute(sql`
        SELECT * FROM "user" WHERE email = ${email}
      `);

      if (existingUsers.length > 0) {
        console.log(
          `El usuario con email ${email} ya existe en la tabla user con ID ${(existingUsers[0] as any).id}`,
        );
        continue;
      }

      // Insertar el usuario en la nueva tabla
      await db.execute(sql`
        INSERT INTO "user" (id, email, name)
        VALUES (${userId}, ${email}, NULL)
      `);

      console.log(`Migrado usuario ${email} (${userId}) a la tabla user`);
    }

    // 4. Si todo fue bien, preguntar si desea eliminar la tabla antigua
    console.log(`
      Migración completada exitosamente.
      
      IMPORTANTE: Ahora debes actualizar el esquema en lib/db/schema.ts para usar la tabla 'user'
      en lugar de 'User'. Después de hacer esta actualización y asegurarte de que todo funciona,
      puedes eliminar la tabla 'User' con:
      
      DROP TABLE "User";
      
      No ejecutes este comando hasta estar seguro de que todo funciona correctamente.
    `);
  } catch (error) {
    console.error('Error al unificar tablas de usuarios:', error);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Error en el script:', err);
  process.exit(1);
});
