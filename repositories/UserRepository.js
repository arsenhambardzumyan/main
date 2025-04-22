const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');
const { logEvent } = require('../utils/logger');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findById(id) {
        const [rows] = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async create(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await super.create({ ...data, password: hashedPassword });
        await logEvent(user.id, 'user_create', null, user);
        return user;
    }
}

module.exports = UserRepository;