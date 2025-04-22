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

// Este script verifica y arregla las referencias a la tabla de usuarios
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Verificando referencias...');

  try {
    // 1. Comprobar que la tabla 'user' existe
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' AND tablename = 'user'
    `);

    if (tables.length === 0) {
      console.error(
        'La tabla "user" no existe. Ejecuta primero el script unify-users.ts',
      );
      return;
    }

    // 2. Obtener todas las tablas con referencias al usuario
    console.log('Verificando tablas con referencias a usuarios...');

    // 2.1 Chat
    console.log('Verificando Chat...');
    try {
      // Comprobar primero si la columna userId es de tipo text
      const chatColumnInfo = await db.execute(sql`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'Chat' AND column_name = 'userId'
      `);

      if (chatColumnInfo.length > 0) {
        const dataType = (chatColumnInfo[0] as any).data_type;
        console.log(`Chat.userId es de tipo: ${dataType}`);

        if (dataType.toLowerCase() !== 'text') {
          console.log('Modificando tipo de Chat.userId a TEXT...');

          // Primero eliminar la restricción de clave foránea
          await db.execute(sql`
            ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_fkey"
          `);

          // Luego modificar el tipo
          await db.execute(sql`
            ALTER TABLE "Chat" ALTER COLUMN "userId" TYPE TEXT
          `);

          // Y restaurar la clave foránea
          await db.execute(sql`
            ALTER TABLE "Chat" 
            ADD CONSTRAINT "Chat_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "user"(id)
          `);

          console.log('Chat.userId modificado correctamente');
        }
      }
    } catch (error) {
      console.error('Error al verificar/modificar Chat:', error);
    }

    // 2.2 Document
    console.log('Verificando Document...');
    try {
      const docColumnInfo = await db.execute(sql`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'Document' AND column_name = 'userId'
      `);

      if (docColumnInfo.length > 0) {
        const dataType = (docColumnInfo[0] as any).data_type;
        console.log(`Document.userId es de tipo: ${dataType}`);

        if (dataType.toLowerCase() !== 'text') {
          console.log('Modificando tipo de Document.userId a TEXT...');

          // Primero eliminar la restricción de clave foránea
          await db.execute(sql`
            ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_fkey"
          `);

          // Luego modificar el tipo
          await db.execute(sql`
            ALTER TABLE "Document" ALTER COLUMN "userId" TYPE TEXT
          `);

          // Y restaurar la clave foránea
          await db.execute(sql`
            ALTER TABLE "Document" 
            ADD CONSTRAINT "Document_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "user"(id)
          `);

          console.log('Document.userId modificado correctamente');
        }
      }
    } catch (error) {
      console.error('Error al verificar/modificar Document:', error);
    }

    // 2.3 Suggestion
    console.log('Verificando Suggestion...');
    try {
      const suggColumnInfo = await db.execute(sql`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'Suggestion' AND column_name = 'userId'
      `);

      if (suggColumnInfo.length > 0) {
        const dataType = (suggColumnInfo[0] as any).data_type;
        console.log(`Suggestion.userId es de tipo: ${dataType}`);

        if (dataType.toLowerCase() !== 'text') {
          console.log('Modificando tipo de Suggestion.userId a TEXT...');

          // Primero eliminar la restricción de clave foránea
          await db.execute(sql`
            ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_fkey"
          `);

          // Luego modificar el tipo
          await db.execute(sql`
            ALTER TABLE "Suggestion" ALTER COLUMN "userId" TYPE TEXT
          `);

          // Y restaurar la clave foránea
          await db.execute(sql`
            ALTER TABLE "Suggestion" 
            ADD CONSTRAINT "Suggestion_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "user"(id)
          `);

          console.log('Suggestion.userId modificado correctamente');
        }
      }
    } catch (error) {
      console.error('Error al verificar/modificar Suggestion:', error);
    }

    console.log(`
      Verificación completada.
      
      Si todo funciona correctamente y has actualizado el esquema en schema.ts,
      puedes eliminar la tabla 'User' (con U mayúscula) con:
      
      DROP TABLE "User";
    `);
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Error en el script:', err);
  process.exit(1);
});
