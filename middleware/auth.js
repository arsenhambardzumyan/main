const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/helpers');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: true, message: 'Token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }
};

module.exports = { authenticateToken };