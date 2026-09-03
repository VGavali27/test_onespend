import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use forward slashes for glob (required on Windows)
const migrationsGlob = path.join(__dirname, 'migrations', '*.js').replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: {
    glob: migrationsGlob,
    // Migrations use the legacy (queryInterface, Sequelize) signature; umzug v3
    // calls up/down with a single context arg. This resolver is synchronous and
    // bridges the two by passing context as the first arg and Sequelize as the second.
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
    logger.info('Database connected');

    const pending = await umzug.pending();
    if (pending.length === 0) {
      logger.info('All migrations are up to date');
    } else {
      logger.info(`${pending.length} migration(s) pending`);
      const migrated = await umzug.up();
      migrated.forEach((m) => logger.info(`Migrated: ${m.name}`));
      logger.info('Migrations completed successfully');
    }
  } catch (err) {
    logger.error(`Migration failed: ${err.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
