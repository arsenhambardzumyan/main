const BaseController = require('./BaseController');
const FileRepository = require('../repositories/FileRepository');
const { logEvent } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class FileController extends BaseController {
    constructor() {
        super(new FileRepository());
        this.UPLOAD_DIR = path.join(__dirname, '../Uploads');
    }

    async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: true, message: 'No file uploaded' });
            }

            const fileData = {
                user_id: req.user.id,
                name: req.file.originalname,
                extension: path.extname(req.file.originalname).slice(1),
                mime_type: req.file.mimetype,
                size: req.file.size,
                file_path: req.file.filename
            };

            const file = await this.repository.create(fileData);
            await logEvent(req.user.id, 'file_upload', null, file);

            return res.status(201).json({
                id: file.id,
                name: file.name,
                extension: file.extension,
                mime_type: file.mime_type,
                size: file.size,
                upload_date: file.upload_date
            });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const perPage = parseInt(req.query.list_size) || 10;
            const result = await this.repository.fetchByUser(req.user.id, page, perPage);

            const formattedData = result.data.map(file => ({
                id: file.id,
                name: file.name,
                extension: file.extension,
                mime_type: file.mime_type,
                size: file.size,
                upload_date: file.upload_date
            }));

            return res.json({
                data: formattedData,
                meta: result.meta
            });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async show(req, res) {
        try {
            const file = await this.repository.find(req.params.id);
            if (!file || file.user_id !== req.user.id) {
                return res.status(404).json({ error: true, message: 'File not found' });
            }

            return res.json({
                id: file.id,
                name: file.name,
                extension: file.extension,
                mime_type: file.mime_type,
                size: file.size,
                upload_date: file.upload_date
            });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async download(req, res) {
        try {
            const file = await this.repository.find(req.params.id);
            if (!file || file.user_id !== req.user.id) {
                return res.status(404).json({ error: true, message: 'File not found' });
            }

            const filePath = path.join(this.UPLOAD_DIR, file.file_path);
            if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
                return res.status(404).json({ error: true, message: 'File not found on server' });
            }

            await logEvent(req.user.id, 'file_download', null, { id: file.id, name: file.name });
            return res.download(filePath, file.name);
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async update(req, res) {
        try {
            const file = await this.repository.find(req.params.id);
            if (!file || file.user_id !== req.user.id) {
                return res.status(404).json({ error: true, message: 'File not found' });
            }

            if (!req.file) {
                return res.status(400).json({ error: true, message: 'No file uploaded' });
            }

            await fs.unlink(path.join(this.UPLOAD_DIR, file.file_path)).catch(() => {});

            const fileData = {
                name: req.file.originalname,
                extension: path.extname(req.file.originalname).slice(1),
                mime_type: req.file.mimetype,
                size: req.file.size,
                file_path: req.file.filename,
                user_id: req.user.id
            };

            const updatedFile = await this.repository.update(req.params.id, fileData);
            return res.json({
                id: updatedFile.id,
                name: updatedFile.name,
                extension: updatedFile.extension,
                mime_type: updatedFile.mime_type,
                size: updatedFile.size,
                upload_date: updatedFile.upload_date
            });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async destroy(req, res) {
        try {
            const file = await this.repository.find(req.params.id);
            if (!file || file.user_id !== req.user.id) {
                return res.status(404).json({ error: true, message: 'File not found' });
            }

            await fs.unlink(path.join(this.UPLOAD_DIR, file.file_path)).catch(() => {});
            const success = await this.repository.delete(req.params.id);
            return res.json({ success });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }
}

module.exports = FileController;