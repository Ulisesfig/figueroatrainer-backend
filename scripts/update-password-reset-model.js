const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/models/PasswordReset.js');
let content = fs.readFileSync(filePath, 'utf8');

// Agregar el nuevo método antes del cierre del objeto
const newMethod = `
  countRecentAttemptsForEmail: async (email, windowMinutes = 10) => {
    const text = \`
      SELECT COUNT(*) as count
      FROM password_resets
      WHERE email = $1 AND created_at > NOW() - INTERVAL '\${windowMinutes} minutes'
    \`;
    const res = await query(text, [email]);
    return parseInt(res.rows[0].count, 10);
  }`;

// Reemplazar el último }; por el nuevo método + };
content = content.replace(/  }\n};/, `  },\n${newMethod}\n};`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Modelo PasswordReset actualizado con countRecentAttemptsForEmail');
