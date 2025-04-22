const BaseRepository = require('./BaseRepository');

class TokenRepository extends BaseRepository {
    constructor() {
        super('tokens');
    }

    async findByRefreshToken(refreshToken) {
        const [rows] = await this.db.query('SELECT * FROM tokens WHERE refresh_token = ?', [refreshToken]);
        return rows[0] || null;
    }

    async deleteByRefreshToken(refreshToken) {
        const [result] = await this.db.query('DELETE FROM tokens WHERE refresh_token = ?', [refreshToken]);
        return result.affectedRows > 0;
    }
}

module.exports = TokenRepository;