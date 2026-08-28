import Joi from 'joi';

export const dashboardQuerySchema = Joi.object({
  period: Joi.string().valid('this_month', 'last_month', 'this_quarter', 'this_year').default('this_month'),
});