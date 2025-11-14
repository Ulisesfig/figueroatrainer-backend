const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/authController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Buscar y reemplazar la sección de cooldown con validación de límite
const oldCode = `      // Cooldown por email para evitar spam de solicitudes
      const COOLDOWN_MS = parseInt(process.env.RECOVER_COOLDOWN_MS || '60000', 10); // 60s por defecto
      let latestReset;
      try {
        latestReset = await PasswordReset.findLatestForEmail(user.email);
      } catch (e) {
        latestReset = null;
      }`;

const newCode = `      // Límite de intentos: máximo 3 envíos cada 10 minutos (1 inicial + 2 reenvíos)
      const MAX_ATTEMPTS = parseInt(process.env.MAX_RECOVER_ATTEMPTS || '3', 10);
      let attemptCount = 0;
      try {
        attemptCount = await PasswordReset.countRecentAttemptsForEmail(user.email, 10);
      } catch (e) {
        console.warn('No se pudo contar intentos:', e.message);
      }

      if (attemptCount >= MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: \`Alcanzaste el límite de \${MAX_ATTEMPTS} intentos en 10 minutos. Esperá un momento antes de reintentar.\`
        });
      }

      // Cooldown por email para evitar spam de solicitudes
      const COOLDOWN_MS = parseInt(process.env.RECOVER_COOLDOWN_MS || '60000', 10); // 60s por defecto
      let latestReset;
      try {
        latestReset = await PasswordReset.findLatestForEmail(user.email);
      } catch (e) {
        latestReset = null;
      }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ authController actualizado con límite de 3 intentos (1 inicial + 2 reenvíos)');
