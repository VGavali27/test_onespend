import Sequelize from 'sequelize';
import sequelize from '../../config/database.js';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const db = {};

// Load all model files in this directory
const files = fs.readdirSync(__dirname).filter(
  (file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js',
);

for (const file of files) {
  const filePath = pathToFileURL(path.join(__dirname, file)).href;
  const modelFactory = (await import(filePath)).default;
  const model = modelFactory(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Run associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
