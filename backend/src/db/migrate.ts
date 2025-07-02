import { sql } from './database.js';
import fs from 'fs';
import path from 'path';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

export class MigrationRunner {
  private migrationsPath = path.join(__dirname, 'migrations');

  async ensureMigrationsTable(): Promise<void> {
    try {
      // Check if migrations table exists with the right structure
      const tableInfo = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'migrations' 
        AND table_schema = 'public'
      `;
      
      if (tableInfo.length === 0) {
        // Table doesn't exist, create it
        await sql`
          CREATE TABLE migrations (
            version INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;
        console.log('✅ Created migrations table');
      } else {
        // Check if it has the right columns
        const hasVersion = tableInfo.some(col => col.column_name === 'version');
        const hasName = tableInfo.some(col => col.column_name === 'name');
        
        if (!hasVersion || !hasName) {
          console.log('⚠️  Migrations table exists but has wrong structure. Dropping and recreating...');
          await sql`DROP TABLE IF EXISTS migrations CASCADE`;
          await sql`
            CREATE TABLE migrations (
              version INTEGER PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `;
          console.log('✅ Recreated migrations table with correct structure');
        }
      }
    } catch (error) {
      console.log('Creating new migrations table...');
      // If there's any error, try to create the table
      await sql`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    }
  }

  async getExecutedMigrations(): Promise<number[]> {
    const result = await sql`
      SELECT version FROM migrations ORDER BY version
    `;
    return result.map(row => row.version);
  }

  async getMigrationFiles(): Promise<Migration[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration filename: ${file}`);
      }

      const version = parseInt(match[1]!);
      const name = match[2]!;
      const filePath = path.join(this.migrationsPath, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      return { version, name, sql: sqlContent };
    });
  }

  async runMigrations(): Promise<void> {
    await this.ensureMigrationsTable();

    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    const pendingMigrations = migrationFiles.filter(
      migration => !executedMigrations.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} migration(s)...`);

    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      
      try {
        await sql.unsafe(migration.sql);
        await sql`
          INSERT INTO migrations (version, name)
          VALUES (${migration.version}, ${migration.name})
        `;
        console.log(`✅ Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`❌ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  }

  async rollback(steps = 1): Promise<void> {
    await this.ensureMigrationsTable();

    const executedMigrations = await sql`
      SELECT version, name FROM migrations 
      ORDER BY version DESC 
      LIMIT ${steps}
    `;

    if (executedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    console.log(`Rolling back ${executedMigrations.length} migration(s)...`);

    for (const migration of executedMigrations) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
      
      // Note: This is a simplified rollback - in practice, you'd want down migrations
      await sql`
        DELETE FROM migrations WHERE version = ${migration.version}
      `;
      
      console.log(`✅ Migration ${migration.version} rolled back`);
    }
  }

  async status(): Promise<void> {
    await this.ensureMigrationsTable();

    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = await this.getMigrationFiles();

    console.log('Migration Status:');
    console.log('================');

    for (const migration of migrationFiles) {
      const status = executedMigrations.includes(migration.version) ? '✅' : '⏳';
      console.log(`${status} ${migration.version}: ${migration.name}`);
    }

    const pendingCount = migrationFiles.length - executedMigrations.length;
    console.log(`\nTotal: ${migrationFiles.length} migrations, ${pendingCount} pending`);
  }
}

// CLI interface
if (import.meta.main) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'status':
        await runner.status();
        break;
      case 'rollback': {
        const steps = parseInt(process.argv[3] || '1');
        await runner.rollback(steps);
        break;
      }
      default:
        await runner.runMigrations();
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }

  process.exit(0);
}