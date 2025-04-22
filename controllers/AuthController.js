const BaseController = require('./BaseController');
const UserRepository = require('../repositories/UserRepository');
const TokenRepository = require('../repositories/TokenRepository');
const { generateTokens, isValidId } = require('../utils/helpers');
const { logEvent } = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { REFRESH_SECRET } = require('../utils/helpers');

class AuthController extends BaseController {
    constructor() {
        super(new UserRepository());
        this.tokenRepository = new TokenRepository();
    }

    async signin(req, res) {
        try {
            const { id, password } = req.body;
            if (!id || !password) {
                return res.status(400).json({ error: true, message: 'ID and password are required' });
            }
            if (!isValidId(id)) {
                return res.status(400).json({ error: true, message: 'Invalid ID format' });
            }

            const user = await this.repository.findById(id);
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: true, message: 'Invalid credentials' });
            }

            const { accessToken, refreshToken } = generateTokens(user);
            await this.tokenRepository.create({ user_id: user.id, refresh_token: refreshToken });
            await logEvent(user.id, 'user_signin', null, { id: user.id });

            return res.json({ access_token: accessToken, refresh_token: refreshToken });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async signup(req, res) {
        try {
            const { id, password } = req.body;
            if (!id || !password) {
                return res.status(400).json({ error: true, message: 'ID and password are required' });
            }
            if (!isValidId(id)) {
                return res.status(400).json({ error: true, message: 'Invalid ID format' });
            }

            const existingUser = await this.repository.findById(id);
            if (existingUser) {
                return res.status(400).json({ error: true, message: 'User already exists' });
            }

            const user = await this.repository.create({ id, password });
            const { accessToken, refreshToken } = generateTokens(user);
            await this.tokenRepository.create({ user_id: user.id, refresh_token: refreshToken });

            return res.status(201).json({ access_token: accessToken, refresh_token: refreshToken });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                return res.status(400).json({ error: true, message: 'Refresh token required' });
            }

            const token = await this.tokenRepository.findByRefreshToken(refresh_token);
            if (!token) {
                return res.status(403).json({ error: true, message: 'Invalid refresh token' });
            }

            let decoded;
            try {
                decoded = jwt.verify(refresh_token, REFRESH_SECRET);
            } catch (err) {
                return res.status(403).json({ error: true, message: 'Invalid refresh token' });
            }

            const user = await this.repository.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ error: true, message: 'User not found' });
            }

            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
            await this.tokenRepository.create({ user_id: user.id, refresh_token: newRefreshToken });
            await this.tokenRepository.deleteByRefreshToken(refresh_token);
            await logEvent(user.id, 'token_refresh', { refresh_token }, { refresh_token: newRefreshToken });

            return res.json({ access_token: accessToken, refresh_token: newRefreshToken });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async info(req, res) {
        try {
            return res.json({ id: req.user.id });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }

    async logout(req, res) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                return res.status(400).json({ error: true, message: 'Token required' });
            }

            const { refresh_token } = req.body;
            if (refresh_token) {
                await this.tokenRepository.deleteByRefreshToken(refresh_token);
            }
            await logEvent(req.user.id, 'user_logout', { refresh_token }, null);

            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: true, message: err.message });
        }
    }
}

module.exports = AuthController;