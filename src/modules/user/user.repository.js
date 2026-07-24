import db from '../../database/models/index.js';

const { User } = db;

class UserRepository {
  async findAll() {
    return User.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findById(id) {
    return User.findByPk(id);
  }

  async findByEmail(email) {
    return User.scope('withPassword').findOne({ where: { email } });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }
}

export default new UserRepository();
