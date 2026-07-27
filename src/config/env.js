import dotenv from 'dotenv';

dotenv.config();

const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'test_onespend',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',

  // 64-char hex key for AES-256-CBC encryption (generate with: crypto.randomBytes(32).toString('hex'))
  encryptionKey: process.env.ENCRYPTION_KEY,

  get isDev() {
    return this.nodeEnv === 'development';
  },

  get isProd() {
    return this.nodeEnv === 'production';
  },
};

export default env;
