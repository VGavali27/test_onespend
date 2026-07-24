import userService from './user.service.js';
import catchAsync from '../../utils/catchAsync.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const getAllUsers = catchAsync(async (_req, res) => {
  const users = await userService.getAll();
  res.status(HTTP_STATUS.OK).json({ success: true, data: users });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json({ success: true, data: user });
});

export const createUser = catchAsync(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: user });
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({ success: true, data: user });
});

export const deleteUser = catchAsync(async (req, res) => {
  const result = await userService.delete(req.params.id);
  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
});
