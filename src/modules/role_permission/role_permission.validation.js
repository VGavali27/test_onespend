import Joi from 'joi'; // Schema for syncing permissions — replaces all existing with the given set (empty array = remove all)
export const syncPermissionSchema = Joi.array().items(Joi.string().uuid()).required();
