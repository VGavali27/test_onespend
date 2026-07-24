import app from './src/app.js';
import env from './src/config/env.js';
import sequelize from './src/config/database.js';

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // ── Sync models (dev only) ──
    if (env.isDev) {
      await sequelize.sync({ alter: true });
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
