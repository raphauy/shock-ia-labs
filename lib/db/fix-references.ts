import { config } from 'dotenv';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import path from 'node:path';
import postgres from 'postgres';

// Cargar variables de entorno desde .env.local
config({
  path: path.resolve(process.cwd(), '.env.local'),
});

// Este script corrige las referencias a la tabla de usuarios después de eliminar User
async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  console.log('POSTGRES_URL configurado:', !!postgresUrl);

  if (!postgresUrl) {
    throw new Error('POSTGRES_URL no está definido');
  }

  const connection = postgres(postgresUrl);
  const db = drizzle(connection);

  console.log('Verificando y corrigiendo las referencias a la tabla user...');

  try {
    // Las tablas que necesitan tener referencias a user
    const tablesToFix = ['Chat', 'Document', 'Suggestion'];

    for (const tableName of tablesToFix) {
      console.log(`Verificando tabla ${tableName}...`);

      // Verificar si ya existe una restricción de clave foránea a la tabla user
      const foreignKeys = await connection`
        SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = ${tableName.toLowerCase()}
          AND ccu.table_name = 'user'
      `;

      if (foreignKeys.length > 0) {
        console.log(
          `La tabla ${tableName} ya tiene una referencia a la tabla user.`,
        );
        continue;
      }

      // Si no existe, crear la restricción
      console.log(
        `Creando referencia en tabla ${tableName} a la tabla user...`,
      );

      try {
        await connection`
          ALTER TABLE ${connection(tableName.toLowerCase())} 
          ADD CONSTRAINT ${connection(`${tableName.toLowerCase()}_userId_fkey`)}
          FOREIGN KEY ("userId") 
          REFERENCES "user"(id) 
          ON DELETE CASCADE
        `;

        console.log(`Restricción creada correctamente para tabla ${tableName}`);
      } catch (error) {
        console.error(
          `Error al crear restricción para tabla ${tableName}:`,
          error,
        );
      }
    }

    console.log('Verificando estructura actualizada de tablas...');

    // Verificar que todas las tablas ahora tienen las referencias correctas
    const finalConstraints = await connection`
      SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'user'
    `;

    console.log('Estructura actual de restricciones:', finalConstraints);

    console.log(`
      Proceso completado con éxito.
      
      Las referencias a la tabla de usuario ahora están correctamente configuradas.
      La aplicación debería funcionar correctamente utilizando únicamente la tabla 'user'.
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
