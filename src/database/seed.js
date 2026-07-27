import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const umzug = new Umzug({
  migrations: { glob: path.join(__dirname, 'seeders', '*.js') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData' }),
  logger: console,
});

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected\n');

    const pending = await umzug.pending();
    if (pending.length === 0) {
      console.log('✓ All seeders are up to date');
    } else {
      console.log(`→ ${pending.length} seeder(s) pending\n`);
      const seeded = await umzug.up();
      seeded.forEach((s) => console.log(`  ✓ ${s.name}`));
      console.log('\n✓ Seeding completed successfully');
    }
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
