const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findById(id) {
    const rows = await db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async findByEmail(email) {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  static async create({ name, email, password }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );
    const userId = result.insertId;

    // Initialize gamification profile
    await db.query(
      'INSERT INTO user_gamification (user_id, xp, level, current_streak, longest_streak, badges_json) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 0, 1, 0, 0, JSON.stringify(['welcome'])]
    );

    // Create a welcome notification
    await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, 'Welcome to Course Manager! 🎉', 'Start by adding your first course and exploring the AI study assistant.', 'system']
    );

    return { id: userId, name: name.trim(), email: email.toLowerCase().trim() };
  }

  static async verifyPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

module.exports = User;
