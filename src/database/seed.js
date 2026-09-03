import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import path from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use forward slashes for glob (required on Windows)
const seedersGlob = path.join(__dirname, 'seeders', '*.js').replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: { glob: seedersGlob },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_data' }),
  logger: console,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    const pending = await umzug.pending();
    if (pending.length === 0) {
      logger.info('All seeders are up to date');
    } else {
      logger.info(`${pending.length} seeder(s) pending`);
      const seeded = await umzug.up();
      seeded.forEach((s) => logger.info(`Seeded: ${s.name}`));
      logger.info('Seeding completed successfully');
    }
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
