const { query } = require('../config/database');

const PasswordReset = {
  create: async ({ userId, email, code, expiresAt }) => {
    const text = `
      INSERT INTO password_resets (user_id, email, code, expires_at)
      VALUES ($1, $$2, $3, to_timestamp($4 / 1000.0))
      RETURNING id, email, code, expires_at, verified, used_at, created_at
    `;
    const values = [userId, email, code, expiresAt];
    const res = await query(text, values);
    return res.rows[0];
  },

  findLatestForEmail: async (email) => {
    const text = `
      SELECT * FROM password_resets
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [email]);
    return res.rows[0];
  },

  findValid: async (email, code) => {
    const text = `
      SELECT * FROM password_resets
      WHERE email = $1 AND code = $2 AND used_at IS NULL AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [email, code]);
    return res.rows[0];
  },

  markVerified: async (email, code) => {
    const text = `
      UPDATE password_resets
      SET verified = true
      WHERE email = $1 AND code = $2 AND used_at IS NULL AND expires_at > NOW()
      RETURNING *
    `;
    const res = await query(text, [email, code]);
    return res.rows[0];
  },

  hasVerifiedValid: async (email) => {
    const text = `
      SELECT * FROM password_resets
      WHERE email = $1 AND verified = true AND used_at IS NULL AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [email]);
    return res.rows[0];
  },

  consumeForEmail: async (email) => {
    const text = `
      UPDATE password_resets
      SET used_at = NOW()
      WHERE email = $1 AND used_at IS NULL AND verified = true
      RETURNING *
    `;
    const res = await query(text, [email]);
    return res.rows[0];
  },

  countRecentAttemptsForEmail: async (email, windowMinutes = 10) => {
    const text = `
      SELECT COUNT(*) as count
      FROM password_resets
      WHERE email = $1 AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
    `;
    const res = await query(text, [email]);
    return parseInt(res.rows[0].count, 10);
  }
};

module.exports = PasswordReset;
