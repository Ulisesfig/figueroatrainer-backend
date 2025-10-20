// Promueve un usuario a admin por email o username
const { Pool } = require('pg');

(async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const args = process.argv.slice(2);
    const emailArgIndex = args.findIndex(a => a === '--email');
    const usernameArgIndex = args.findIndex(a => a === '--username');

    let email = null;
    let username = null;

    if (emailArgIndex !== -1) {
      email = (args[emailArgIndex + 1] || '').trim().toLowerCase();
    }
    if (usernameArgIndex !== -1) {
      username = (args[usernameArgIndex + 1] || '').trim();
    }

    if (!email && !username) {
      console.error('Uso: node scripts/promote-admin.js --email user@example.com | --username 12345678');
      process.exit(1);
    }

    let where = '';
    let value = '';
    if (email) { where = 'email = $1'; value = email; }
    else { where = 'username = $1'; value = username; }

    const selectRes = await pool.query(`SELECT id, email, username, role FROM users WHERE ${where} LIMIT 1`, [value]);
    if (selectRes.rowCount === 0) {
      console.error('Usuario no encontrado');
      process.exit(1);
    }

    const user = selectRes.rows[0];
    if (user.role === 'admin') {
      console.log('El usuario ya es admin.');
      process.exit(0);
    }

    const updateRes = await pool.query(`UPDATE users SET role = 'admin' WHERE ${where}`, [value]);
    console.log(`✅ Usuario promovido a admin:`, { id: user.id, email: user.email, username: user.username });
    process.exit(0);
  } catch (e) {
    console.error('❌ Error promoviendo a admin:', e.message);
    process.exit(1);
  }
})();
