import * as authService from './auth.service.js';
import ApiResponse from '../../utils/apiResponse.js';

// Login with email and password
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};
