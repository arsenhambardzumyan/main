const express = require('express');
const cors = require('cors');
const { authenticateToken } = require('./middleware/auth');
const AuthController = require('./controllers/AuthController');
const FileController = require('./controllers/FileController');
const { initDb } = require('./utils/helpers');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Debug: Log the imported FileController to verify
console.log('FileController:', require('./controllers/FileController'));

const app = express();
const port = 3000;

// Configuration
const UPLOAD_DIR = path.join(__dirname, 'Uploads');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Initialize database
initDb().catch(console.error);

// Controllers
const authController = new AuthController();
const fileController = new FileController();

// Routes
app.post('/signin', (req, res) => authController.signin(req, res));
app.post('/signin/new_token', (req, res) => authController.refreshToken(req, res));
app.post('/signup', (req, res) => authController.signup(req, res));
app.get('/info', authenticateToken, (req, res) => authController.info(req, res));
app.get('/logout', authenticateToken, (req, res) => authController.logout(req, res));

app.post('/file/upload', authenticateToken, upload.single('file'), (req, res) => fileController.upload(req, res));
app.get('/file/list', authenticateToken, (req, res) => fileController.list(req, res));
app.get('/file/:id', authenticateToken, (req, res) => fileController.show(req, res));
app.get('/file/download/:id', authenticateToken, (req, res) => fileController.download(req, res));
app.put('/file/update/:id', authenticateToken, upload.single('file'), (req, res) => fileController.update(req, res));
app.delete('/file/delete/:id', authenticateToken, (req, res) => fileController.destroy(req, res));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: true, message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});