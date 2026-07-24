import userRepository from './user.repository.js';
import ApiError from '../../utils/ApiError.js';
import { HTTP_STATUS } from '../../constants/index.js';

class UserService {
  async getAll() {
    return userRepository.findAll();
  }

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    return user;
  }

  async create(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
    }
    return userRepository.create(data);
  }

  async update(id, data) {
    const user = await userRepository.update(id, data);
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    return user;
  }

  async delete(id) {
    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }
    return { message: 'User deleted successfully' };
  }
}

export default new UserService();
