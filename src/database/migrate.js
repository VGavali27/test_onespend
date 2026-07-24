import { Umzug } from 'umzug';
import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const umzug = new Umzug({
  migrations: { glob: path.join(__dirname, 'migrations', '*.js') },
  context: sequelize.getQueryInterface(),
  storage: 'sequelize',
  storageOptions: { sequelize },
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
