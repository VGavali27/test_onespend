import Joi from 'joi';

export const logsQuerySchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'date must be in YYYY-MM-DD format',
    }),
});