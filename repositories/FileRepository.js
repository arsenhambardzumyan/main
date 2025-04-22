const BaseRepository = require('./BaseRepository');
const { logEvent } = require('../utils/logger');

class FileRepository extends BaseRepository {
    constructor() {
        super('files');
    }

    async findById(id) {
        const [rows] = await this.db.query('SELECT * FROM files WHERE id = ?', [id]);
        return rows[0] || null;
    }

    async fetchByUser(userId, page, perPage) {
        return this.fetch(page, perPage, { user_id: userId });
    }

    async update(id, data) {
        const oldFile = await this.find(id);
        const updatedFile = await super.update(id, data);
        await logEvent(data.user_id, 'file_update', oldFile, updatedFile);
        return updatedFile;
    }

    async delete(id) {
        const file = await this.find(id);
        const success = await super.delete(id);
        if (success) {
            await logEvent(file.user_id, 'file_delete', file, null);
        }
        return success;
    }
}

module.exports = FileRepository;