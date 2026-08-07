import app from './src/app.js';
import env from './src/config/env.js';
import sequelize from './src/config/database.js';

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // ── Sync models (dev only) ──
    // NOTE: use sync() WITHOUT alter. alter:true re-adds unique indexes on every
    // boot (model default names `uuid`/`code` vs migration names `idx_*`), so MySQL
    // keeps appending `uuid_2`, `uuid_3` … until the 64-key table limit is hit.
    // sync() only creates missing tables and never touches existing ones.
    if (env.isDev) {
      await sequelize.sync();
      console.log('✓ Models synchronized');
    }
  } catch (error) {
    console.warn('⚠ Database connection failed:', error.message);
    console.warn('  Server will start without database');
  }

  app.listen(env.port, () => {
    console.log(`\n  🚀 Server running on port ${env.port}`);
    console.log(`  📦 Environment: ${env.nodeEnv}\n`);
  });
};

start();
