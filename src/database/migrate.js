import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use forward slashes for glob (required on Windows)
const migrationsGlob = path.join(__dirname, 'migrations', '*.js').replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: { glob: migrationsGlob },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    const pending = await umzug.pending();
    if (pending.length === 0) {
      console.log('✓ All migrations are up to date');
    } else {
      console.log(`→ ${pending.length} migration(s) pending\n`);
      const migrated = await umzug.up();
      migrated.forEach((m) => console.log(`  ✓ ${m.name}`));
      console.log('\n✓ Migrations completed successfully');
    }
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
