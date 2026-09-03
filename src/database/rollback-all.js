/**
 * Rollback ALL migrations
 */
import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import logger from '../utils/logger.js';

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
    logger.info('Database connected');

    let rolledBack = 0;
    while (true) {
      const executed = await umzug.executed();
      if (executed.length === 0) {
        logger.info('No migrations to roll back');
        break;
      }
      const rolled = await umzug.down();
      rolled.forEach((m) => logger.info(`Rolled back: ${m.name}`));
      rolledBack += rolled.length;
    }

    // Clear seeder tracking table so seeders can run fresh
    const qi = sequelize.getQueryInterface();
    const tables = await qi.showAllTables();
    if (tables.includes('sequelize_data')) {
      await qi.bulkDelete('sequelize_data', null);
      logger.info('Cleared seeder tracking (sequelize_data)');
    }

    logger.info(`Rollback completed successfully (${rolledBack} migration(s) rolled back)`);
  } catch (err) {
    logger.error(`Rollback failed: ${err.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();