const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret_key';
const REFRESH_SECRET = 'your_refresh_secret_key';
const TOKEN_EXPIRY = '10m';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'ServBay.dev',
    database: 'file_service'
};

let db;
async function initDb() {
    db = await mysql.createConnection(dbConfig);
    await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await db.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      extension VARCHAR(50),
      mime_type VARCHAR(100),
      size BIGINT,
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      file_path VARCHAR(255) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
    await db.query(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      refresh_token VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
    await db.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      event_type VARCHAR(100),
      old_data TEXT,
      new_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

const generateTokens = (user) => {
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET);
    return { accessToken, refreshToken };
};

const isValidId = (id) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return emailRegex.test(id) || phoneRegex.test(id);
};

module.exports = { db, initDb, generateTokens, isValidId, JWT_SECRET, REFRESH_SECRET };