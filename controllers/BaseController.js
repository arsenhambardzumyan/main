class BaseController {
    constructor(repository) {
        this.repository = repository;
    }

    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.list_size) || 10;
            const result = await this.repository.fetch(page, perPage);
            return res.json(result);
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async show(req, res) {
        try {
            const item = await this.repository.find(req.params.id);
            if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
            return res.json(item);
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async store(req, res) {
        try {
            const item = await this.repository.create(req.body);
            return res.status(201).json(item);
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async update(req, res) {
        try {
            const item = await this.repository.update(req.params.id, req.body);
            if (!item) return res.status(404).json({ error: true, message: 'Item not found' });
            return res.json(item);
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async destroy(req, res) {
        try {
            const success = await this.repository.delete(req.params.id);
            if (!success) return res.status(404).json({ error: true, message: 'Item not found' });
            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }
}

module.exports = BaseController;