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

// Este script mantiene sincronizados los usuarios entre ambas tablas
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Sincronizando usuarios entre tablas...');

  try {
    // 1. Obtener usuarios de las tablas User y user
    const usersMayuscula = await db.execute(sql`SELECT * FROM "User"`);
    const usersMinuscula = await db.execute(sql`SELECT * FROM "user"`);

    console.log(
      `Encontrados ${usersMayuscula.length} usuarios en la tabla User`,
    );
    console.log(
      `Encontrados ${usersMinuscula.length} usuarios en la tabla user`,
    );

    // 2. Crear un disparador para mantener sincronizados los usuarios
    // Este disparador copiará los datos de email cuando se inserte un nuevo usuario en 'user'
    console.log('Creando función y disparador para sincronizar usuarios...');

    // 2.1. Crear la función que copiará los datos
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION sync_user_to_User()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Si el email ya existe en User, no hacer nada
        IF EXISTS (SELECT 1 FROM "User" WHERE email = NEW.email) THEN
          RETURN NEW;
        END IF;
        
        -- Insertar en User el nuevo usuario
        INSERT INTO "User" (id, email) 
        VALUES (NEW.id::uuid, NEW.email);
        
        RETURN NEW;
      EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'Error en sync_user_to_User: %', SQLERRM;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2.2. Crear el disparador
    // Primero eliminamos el disparador si ya existe
    await db.execute(sql`
      DROP TRIGGER IF EXISTS user_insert_trigger ON "user";
    `);

    // Luego creamos el nuevo disparador
    await db.execute(sql`
      CREATE TRIGGER user_insert_trigger
      AFTER INSERT ON "user"
      FOR EACH ROW
      EXECUTE FUNCTION sync_user_to_User();
    `);

    console.log('Disparador creado correctamente');

    // 3. Información sobre qué hacer a continuación
    console.log(`
      Configuración completada.
      
      Se ha configurado un disparador que mantendrá sincronizadas ambas tablas. 
      Cada vez que se cree un usuario en la tabla 'user', se copiará a la tabla 'User'.
      
      Para usar exclusivamente la tabla 'user' de Auth.js, deberías:
      
      1. Modificar lib/db/queries.ts para usar directamente la tabla 'user'
      2. Luego de verificar que todo funciona correctamente, podrías eliminar 
         la dependencia de la tabla 'User' y el disparador con:
         
         DROP TRIGGER IF EXISTS user_insert_trigger ON "user";
         DROP FUNCTION IF EXISTS sync_user_to_User();
         DROP TABLE IF EXISTS "User";
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
