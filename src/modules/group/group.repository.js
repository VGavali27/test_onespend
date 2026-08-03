import db from '../../database/models/index.js';
const { Group } = db;

// Fetch all groups ordered by creation date (newest first)
export const findAll = async () => Group.findAll({ order: [['createdAt', 'DESC']] });

// Lightweight dropdown options — only uuid + name
export const findOptions = async () =>
  Group.findAll({ attributes: ['uuid', 'name'], order: [['name', 'ASC']] });

// Find a group by UUID
export const findByUuid = async (uuid) => Group.findOne({ where: { uuid } });
