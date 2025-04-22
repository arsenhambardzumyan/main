const { db } = require('../utils/helpers');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async fetch(page = 1, perPage = 10, conditions = {}) {
        const offset = (page - 1) * perPage;
        let query = `SELECT * FROM ${this.model}`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.model}`;
        const values = [];

        if (Object.keys(conditions).length) {
            const whereClauses = Object.keys(conditions).map(key => `${key} = ?`);
            query += ` WHERE ${whereClauses.join(' AND ')}`;
            countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
            values.push(...Object.values(conditions));
        }

        query += ` LIMIT ? OFFSET ?`;
        values.push(perPage, offset);

        const [rows] = await db.query(query, values);
        const [[{ total }]] = await db.query(countQuery, values.slice(0, values.length - 2));

        return {
            data: rows,
            meta: {
                current_page: page,
                per_page: perPage,
                total,
                last_page: Math.ceil(total / perPage)
            }
        };
    }

    async create(data) {
        const [result] = await db.query(`INSERT INTO ${this.model} SET ?`, data);
        const created = await this.find(result.insertId || data.id);
        return created;
    }

    async update(id, data) {
        await db.query(`UPDATE ${this.model} SET ? WHERE id = ?`, [data, id]);
        return this.find(id);
    }

    async delete(id) {
        const [result] = await db.query(`DELETE FROM ${this.model} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }

    async find(id) {
        const [rows] = await db.query(`SELECT * FROM ${this.model} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
}

module.exports = BaseRepository;