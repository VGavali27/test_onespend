import Joi from 'joi';

export const notificationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: Joi.string().valid('assigned', 'activity').allow(''),
  scope: Joi.string().valid('expense', 'procurement').allow(''),
});
