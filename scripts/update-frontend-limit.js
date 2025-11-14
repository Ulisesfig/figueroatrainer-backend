const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../figueroatrainer-frontend-4d1000023c1c3e76c7d515f1abf13a8edc8069db/public/pages/verificar-codigo.html');
let content = fs.readFileSync(filePath, 'utf8');

// Agregar manejo del error 429 (límite alcanzado)
const oldCode = `          if (response.ok && data.success) {
            const cooldownMs = parseInt(data.cooldownMs || '60000', 10);
            const until = Date.now() + cooldownMs;
            localStorage.setItem('resendCooldownUntil', String(until));

            const statusText = data.emailQueued ? 'Envío en curso. ' : '';
            successMessage.textContent = \`\${statusText}Código reenviado. Revisá tu email.\`;
            successMessage.classList.add('show');
            
            // Cooldown dinámico
            let countdown = Math.ceil(cooldownMs / 1000);
            resendBtn.textContent = \`Reenviar en \${countdown}s\`;
            const interval = setInterval(() => {
              countdown--;
              resendBtn.textContent = \`Reenviar en \${countdown}s\`;
              if (countdown <= 0) {
                clearInterval(interval);
                resendBtn.textContent = 'Reenviar código';
                resendBtn.disabled = false;
                localStorage.removeItem('resendCooldownUntil');
              }
            }, 1000);
          } else {
            errorMessage.textContent = data.message || 'No se pudo reenviar el código';
            errorMessage.classList.add('show');
            resendBtn.textContent = 'Reenviar código';
            resendBtn.disabled = false;
          }`;

const newCode = `          if (response.ok && data.success) {
            const cooldownMs = parseInt(data.cooldownMs || '60000', 10);
            const until = Date.now() + cooldownMs;
            localStorage.setItem('resendCooldownUntil', String(until));

            const statusText = data.emailQueued ? 'Envío en curso. ' : '';
            successMessage.textContent = \`\${statusText}Código reenviado. Revisá tu email.\`;
            successMessage.classList.add('show');
            
            // Cooldown dinámico
            let countdown = Math.ceil(cooldownMs / 1000);
            resendBtn.textContent = \`Reenviar en \${countdown}s\`;
            const interval = setInterval(() => {
              countdown--;
              resendBtn.textContent = \`Reenviar en \${countdown}s\`;
              if (countdown <= 0) {
                clearInterval(interval);
                resendBtn.textContent = 'Reenviar código';
                resendBtn.disabled = false;
                localStorage.removeItem('resendCooldownUntil');
              }
            }, 1000);
          } else if (response.status === 429) {
            // Límite de intentos alcanzado
            errorMessage.textContent = data.message || 'Alcanzaste el límite de intentos. Esperá unos minutos.';
            errorMessage.classList.add('show');
            resendBtn.textContent = 'Límite alcanzado';
            resendBtn.disabled = true;
            
            // Deshabilitar por 10 minutos
            setTimeout(() => {
              resendBtn.textContent = 'Reenviar código';
              resendBtn.disabled = false;
            }, 10 * 60 * 1000);
          } else {
            errorMessage.textContent = data.message || 'No se pudo reenviar el código';
            errorMessage.classList.add('show');
            resendBtn.textContent = 'Reenviar código';
            resendBtn.disabled = false;
          }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Frontend verificar-codigo.html actualizado con manejo de límite 429');
