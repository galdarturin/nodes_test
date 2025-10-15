const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    database: process.env.PGDATABASE || 'bookingdb',
    password: process.env.PGPASSWORD || 'yourpassword',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  });

  const client = await pool.connect();
  try {
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.toLowerCase().endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found, skipping migrations.');
      return;
    }

    console.log(`Running ${files.length} migration(s)...`);

    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`Applying migration: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`Migration applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration ${file}:`, err.message);
        throw err;
      }
    }

    console.log('All migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { runMigrations };
