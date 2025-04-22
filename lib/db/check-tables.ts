import postgres from 'postgres';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function main() {
  // Verificar si POSTGRES_URL está configurado
  const postgresUrl = process.env.POSTGRES_URL;

  console.log(`POSTGRES_URL configurado: ${Boolean(postgresUrl)}`);

  if (!postgresUrl) {
    console.error(
      'Error: POSTGRES_URL no está configurado en las variables de entorno.',
    );
    process.exit(1);
  }

  // Inicializar conexión
  const sql = postgres(postgresUrl);

  try {
    // Consultar las tablas existentes
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('Tablas existentes en la base de datos:');
    tables.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });

    // También mostrar relaciones de clave foránea
    const foreignKeys = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `;

    console.log('\nRelaciones de clave foránea existentes:');
    foreignKeys.forEach((row) => {
      console.log(
        `- ${row.table_name}.${row.column_name} -> ${row.referenced_table}.${row.referenced_column} (${row.constraint_name})`,
      );
    });
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
  } finally {
    // Cerrar conexión
    await sql.end();
  }
}

main().catch((error) => {
  console.error('Error no controlado:', error);
  process.exit(1);
});
