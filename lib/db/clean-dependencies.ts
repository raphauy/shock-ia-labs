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

// Este script elimina todas las dependencias de la tabla User
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Verificando las dependencias actuales...');

  try {
    // 1. Verificar dependencias para informar al usuario
    const constraints = await db.execute(sql`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint 
      WHERE confrelid = 'public."User"'::regclass
    `);

    console.log('Restricciones encontradas:', constraints);

    // 2. Eliminar el disparador de sincronización primero
    console.log('Eliminando el disparador de sincronización...');

    await db.execute(sql`
      DROP TRIGGER IF EXISTS user_insert_trigger ON "user"
    `);

    await db.execute(sql`
      DROP FUNCTION IF EXISTS sync_user_to_User()
    `);

    console.log('Disparador y función eliminados correctamente');

    // 3. Verificar que las referencias de clave foránea estén correctamente establecidas a la tabla 'user'
    console.log(
      'Verificando que las tablas estén referenciando a la tabla "user"...',
    );

    const chatColumnInfo = await db.execute(sql`
      SELECT ccu.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name IN ('Chat', 'Document', 'Suggestion') AND tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'user'
    `);

    console.log('Referencias a la tabla "user":', chatColumnInfo);

    // 4. Ahora eliminar la tabla User con CASCADE para eliminar todas las dependencias
    console.log('Eliminando la tabla User con CASCADE...');

    await db.execute(sql`DROP TABLE IF EXISTS "User" CASCADE`);

    console.log(
      'Tabla User eliminada correctamente con todas sus dependencias',
    );

    console.log(`
      Limpieza completada con éxito.
      
      Todas las dependencias de la tabla User han sido eliminadas y la 
      tabla User ha sido eliminada. Ahora estás usando exclusivamente 
      la tabla 'user' de Auth.js.
      
      Verifica que todo siga funcionando correctamente en tu aplicación.
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
