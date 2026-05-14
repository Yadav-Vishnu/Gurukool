import * as fs from 'fs';
import * as path from 'path';
import { pool, testConnection } from '../config/database';

/**
 * Database Migration Runner
 *
 * Reads all .sql files from the migrations/ folder and executes them
 * in order. Tracks which migrations have been run to avoid duplicates.
 *
 * Usage: npm run migrate
 */
async function runMigrations(): Promise<void> {
  console.log('\n🗃️  Running database migrations...\n');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Is Docker running?');
    process.exit(1);
  }

  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Get list of already-run migrations
  const executedResult = await pool.query('SELECT filename FROM _migrations ORDER BY id');
  const executedMigrations = new Set(executedResult.rows.map(r => r.filename));

  // Read migration files
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  No migrations directory found');
    await pool.end();
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical order ensures correct execution order

  let ranCount = 0;

  for (const file of files) {
    if (executedMigrations.has(file)) {
      console.log(`  ✅ ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      console.log(`  🆕 ${file} (applied successfully)`);
      ranCount++;
    } catch (error: any) {
      await pool.query('ROLLBACK');
      console.error(`  ❌ ${file} FAILED:`, error.message);
      await pool.end();
      process.exit(1);
    }
  }

  console.log(`\n✅ Migrations complete. ${ranCount} new migration(s) applied.\n`);
  await pool.end();
}

runMigrations().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
