/**
 * Rollback the last batch of migrations
 */
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

    const executed = await umzug.executed();
    if (executed.length === 0) {
      console.log('✓ No migrations to roll back');
    } else {
      const rolled = await umzug.down();
      rolled.forEach((m) => console.log(`  ✗ Rolled back: ${m.name}`));
      console.log('\n✓ Rollback completed successfully');
    }
  } catch (err) {
    console.error('✗ Rollback failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
