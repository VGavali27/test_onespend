/**
 * Rollback the last batch of migrations
 */
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

    const executed = await umzug.executed();
    if (executed.length === 0) {
      logger.info('No migrations to roll back');
    } else {
      const rolled = await umzug.down();
      rolled.forEach((m) => logger.info(`Rolled back: ${m.name}`));
      logger.info('Rollback completed successfully');
    }
  } catch (err) {
    logger.error(`Rollback failed: ${err.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
