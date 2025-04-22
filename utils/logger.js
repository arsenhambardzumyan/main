const { db } = require('./helpers');

const logEvent = async (userId, eventType, oldData = null, newData = null) => {
    try {
        await db.query(
            'INSERT INTO logs (user_id, event_type, old_data, new_data) VALUES (?, ?, ?, ?)',
            [userId, eventType, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null]
        );
    } catch (err) {
        console.error('Error logging event:', err);
    }
};

module.exports = { logEvent };