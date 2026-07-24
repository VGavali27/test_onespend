import { HTTP_STATUS } from '../constants/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory — takes a Joi/Zod schema and returns validation middleware.
 * Validates req.body by default; pass 'query' or 'params' as the second arg.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return next(new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, messages));
  }

  req[source] = value;
  next();
};

export default validate;
