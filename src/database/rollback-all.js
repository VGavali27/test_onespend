/**
 * Rollback ALL migrations
 */
import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsGlob = path.join(__dirname, 'migrations', '*.js').replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: {
    glob: migrationsGlob,
    resolve: ({ name, path: filePath, context }) => ({
      name,
      up: async () => (await import(pathToFileURL(filePath))).up(context, Sequelize),
      down: async () => (await import(pathToFileURL(filePath))).down(context, Sequelize),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
  logger: console,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    let rolledBack = 0;
    while (true) {
      const executed = await umzug.executed();
      if (executed.length === 0) {
        console.log('✓ No migrations to roll back');
        break;
      }
      const rolled = await umzug.down();
      rolled.forEach((m) => console.log(`  ✗ Rolled back: ${m.name}`));
      rolledBack += rolled.length;
    }
    console.log(`\n✓ Rollback completed successfully (${rolledBack} migration(s) rolled back)`);
  } catch (err) {
    console.error('✗ Rollback failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();